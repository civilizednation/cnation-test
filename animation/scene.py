"""문명국 — 6초 세로 3D 애니메이션을 bpy만으로 만든다.

사용법 (둘 다 헤드리스):
    blender -b -P scene.py -- [--preview] [--out DIR] [--frames 1,30,60]
    python scene.py [--preview] [--out DIR] [--frames 1,30,60]   # pip install bpy

--preview  : 50% 해상도, 낮은 샘플 수, 기본값으로 30프레임마다 한 장씩
--frames   : 렌더할 프레임 목록(쉼표 구분). 없으면 전체 애니메이션
--save     : .blend 파일 경로(선택)
"""
import math
import os
import sys

import bpy  # bpy 를 먼저 불러와야 pip 판 bpy 에서 bmesh 가 보인다
import bmesh
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_PATH = os.path.join(HERE, "fonts", "Pretendard-ExtraBold.otf")

FPS = 30
FRAMES = 180
RES = (720, 1280)

OFF_WHITE = "#F1ECE3"
KEY_WHITE = "#ECE6DC"
DARK = "#2E2F33"
ORANGE = "#FF5A1F"

KEY_XS = (-2.1, 0.0, 2.1)
LETTERS = ("문", "명", "국")
KEY_SIZE = 1.7
KEY_BOTTOM = 0.1
KEY_TOP = 0.75
PLATE_TOP = 0.3
PRESS = 0.16
CUBE = 0.8


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    opts = {"preview": False, "out": os.path.join(HERE, "frames"), "frames": None, "save": None}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--preview":
            opts["preview"] = True
        elif a in ("--out", "--frames", "--save"):
            opts[a[2:]] = argv[i + 1]
            i += 1
        i += 1
    if opts["frames"]:
        opts["frames"] = [int(f) for f in opts["frames"].split(",")]
    elif opts["preview"]:
        opts["frames"] = [1] + list(range(30, FRAMES + 1, 30))
    return opts


def srgb(hex_color, alpha=1.0):
    """#RRGGBB(sRGB) → 씬 선형 RGBA."""
    h = hex_color.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, alpha)


# ----------------------------------------------------------------- 씬 기본

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_start = 1
    scene.frame_end = FRAMES
    scene.render.resolution_x, scene.render.resolution_y = RES
    scene.render.resolution_percentage = 100
    return scene


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def empty(name, loc=(0, 0, 0), parent=None):
    e = link(bpy.data.objects.new(name, None))
    e.empty_display_size = 0.3
    e.location = loc
    e.parent = parent
    return e


def mesh_obj(name, bm):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return link(bpy.data.objects.new(name, me))


def apply_modifiers(obj):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    old = obj.data
    obj.modifiers.clear()
    obj.data = me
    bpy.data.meshes.remove(old)


def smooth_by_angle(obj, angle_deg=35):
    """Auto Smooth 대신: 면 각도로 날카로운 모서리만 표시하고 나머지는 부드럽게."""
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    lim = math.radians(angle_deg)
    for f in bm.faces:
        f.smooth = True
    for e in bm.edges:
        e.smooth = not (len(e.link_faces) == 2 and e.calc_face_angle(0) > lim)
    bm.to_mesh(me)
    bm.free()


def rounded_box(name, size, bevel, segments=6, taper=1.0):
    """중심 (0,0), 바닥 z=0 인 둥근 상자. taper<1 이면 윗면이 좁아짐(키캡)."""
    sx, sy, sz = size
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z = (v.co.z + 0.5) * sz
        if v.co.z > sz * 0.5:
            v.co.x *= taper
            v.co.y *= taper
    obj = mesh_obj(name, bm)
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = bevel
    mod.segments = segments
    mod.limit_method = "NONE"
    mod.profile = 0.6
    apply_modifiers(obj)
    smooth_by_angle(obj)
    return obj


# ----------------------------------------------------------------- 재질

def principled(name, color, rough, **extra):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = srgb(color)
    bsdf.inputs["Roughness"].default_value = rough
    for k, v in extra.items():
        bsdf.inputs[k].default_value = v
    return mat, nt, bsdf


def add_micro_bump(nt, bsdf, scale, strength, rough_var=0.0):
    """무광 플라스틱/종이 같은 미세 요철 + 거칠기 편차 (기본 재질 느낌 방지)."""
    tc = nt.nodes.new("ShaderNodeTexCoord")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 8.0
    nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    bump.inputs["Distance"].default_value = 0.02
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    if rough_var:
        base = bsdf.inputs["Roughness"].default_value
        mr = nt.nodes.new("ShaderNodeMapRange")
        mr.inputs["To Min"].default_value = base - rough_var
        mr.inputs["To Max"].default_value = base + rough_var
        nt.links.new(noise.outputs["Fac"], mr.inputs["Value"])
        nt.links.new(mr.outputs["Result"], bsdf.inputs["Roughness"])


def make_materials():
    m = {}
    mat, nt, b = principled("Floor", OFF_WHITE, 0.85)
    add_micro_bump(nt, b, 180.0, 0.06, 0.05)
    m["floor"] = mat

    mat, nt, b = principled("KeyPlastic", KEY_WHITE, 0.42, **{"Specular IOR Level": 0.45})
    add_micro_bump(nt, b, 420.0, 0.035, 0.06)
    m["key"] = mat

    mat, nt, b = principled("Engrave", DARK, 0.6)
    m["engrave"] = mat

    mat, nt, b = principled("Plate", DARK, 0.5, **{"Specular IOR Level": 0.4})
    add_micro_bump(nt, b, 300.0, 0.03, 0.05)
    m["plate"] = mat

    mat, nt, b = principled(
        "Jelly", ORANGE, 0.22,
        **{
            "Subsurface Weight": 0.45,
            "Subsurface Radius": (1.0, 0.3, 0.1),
            "Subsurface Scale": 0.1,
            "Coat Weight": 0.25,
            "Coat Roughness": 0.08,
            "Specular IOR Level": 0.55,
        },
    )
    m["jelly"] = mat

    mat, nt, b = principled("Eye", "#1F2023", 0.12, **{"Coat Weight": 0.6, "Coat Roughness": 0.03})
    m["eye"] = mat
    return m


# ----------------------------------------------------------------- 무대

def build_cyclorama(mat):
    """바닥이 반지름 6의 곡면으로 벽과 이어지는 무한 배경."""
    prof = [(-30.0, 0.0)]
    y0, r = 6.0, 6.0
    for i in range(25):
        a = (i / 24) * (math.pi / 2)
        prof.append((y0 + math.sin(a) * r, r - math.cos(a) * r))
    prof.append((y0 + r, 30.0))
    bm = bmesh.new()
    rows = []
    for x in (-40.0, 40.0):
        rows.append([bm.verts.new((x, y, z)) for y, z in prof])
    for i in range(len(prof) - 1):
        bm.faces.new((rows[0][i], rows[1][i], rows[1][i + 1], rows[0][i + 1]))
    obj = mesh_obj("Cyclorama", bm)
    for p in obj.data.polygons:
        p.use_smooth = True
    obj.data.materials.append(mat)
    return obj


def build_keys(mats):
    font = bpy.data.fonts.load(FONT_PATH)
    plate = rounded_box("Plate", (6.6, 2.5, PLATE_TOP), 0.14, segments=6)
    plate.data.materials.append(mats["plate"])

    keys = []
    for x, letter in zip(KEY_XS, LETTERS):
        key = rounded_box(f"Key_{letter}", (KEY_SIZE, KEY_SIZE, KEY_TOP - KEY_BOTTOM), 0.16,
                          segments=6, taper=0.86)
        key.data.materials.append(mats["key"])
        key.location = (x, 0, KEY_BOTTOM)

        # 음각: 텍스트를 메시로 바꿔 불리언 차집합. 잘린 면에는 커터의 짙은 재질이 옮겨짐.
        cu = bpy.data.curves.new(f"Text_{letter}", "FONT")
        cu.body = letter
        cu.font = font
        cu.size = 0.98
        cu.align_x = "CENTER"
        cu.align_y = "CENTER"
        cu.extrude = 0.06
        cu.bevel_depth = 0.006
        cu.resolution_u = 8
        txt = link(bpy.data.objects.new(f"TextCurve_{letter}", cu))
        txt.location = (0, 0, KEY_TOP - KEY_BOTTOM)
        dg = bpy.context.evaluated_depsgraph_get()
        cutter_me = bpy.data.meshes.new_from_object(txt.evaluated_get(dg))
        bpy.data.objects.remove(txt)
        cutter = link(bpy.data.objects.new(f"Cutter_{letter}", cutter_me))
        cutter.location = (0, 0, KEY_TOP - KEY_BOTTOM)
        cutter.data.materials.append(mats["engrave"])
        bm = bmesh.new()
        bm.from_mesh(cutter.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        bm.to_mesh(cutter.data)
        bm.free()

        # 키캡 로컬 좌표에서 자르기 위해 위치를 잠깐 원점으로
        key.location = (0, 0, 0)
        mod = key.modifiers.new("engrave", "BOOLEAN")
        mod.operation = "DIFFERENCE"
        mod.solver = "EXACT"
        mod.material_mode = "TRANSFER"
        mod.object = cutter
        apply_modifiers(key)
        bpy.data.objects.remove(cutter)
        smooth_by_angle(key, 30)
        key.location = (x, 0, KEY_BOTTOM)
        keys.append(key)
    return plate, keys


def build_character(mats):
    root = empty("CharRoot")
    squash = empty("Squash", parent=root)  # 발바닥 피벗: 스케일하면 바닥에 붙은 채 납작해짐

    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=CUBE)
    for v in bm.verts:
        v.co.z += CUBE / 2
    body = mesh_obj("Jelly", bm)
    bev = body.modifiers.new("bevel", "BEVEL")
    bev.width = 0.17
    bev.segments = 4
    sub = body.modifiers.new("subsurf", "SUBSURF")
    sub.levels = 2
    sub.render_levels = 3
    for p in body.data.polygons:
        p.use_smooth = True
    body.data.materials.append(mats["jelly"])
    body.parent = squash

    eyes = []
    for sx in (-1, 1):
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=1.0)
        eye = mesh_obj(f"Eye_{'L' if sx < 0 else 'R'}", bm)
        for p in eye.data.polygons:
            p.use_smooth = True
        eye.data.materials.append(mats["eye"])
        eye.parent = body
        eye.location = (sx * 0.15, -CUBE / 2 - 0.004, CUBE * 0.6)
        eye.scale = (0.052, 0.026, 0.078)
        eyes.append(eye)
    return root, squash, body, eyes


def build_lights():
    scene = bpy.context.scene
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = srgb("#F2F1EE")
    bg.inputs["Strength"].default_value = 0.22

    def area(name, loc, target, power, size, size_y=None, color="#FFFAF4"):
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy = power
        ld.color = srgb(color)[:3]
        if size_y is None:
            ld.shape = "SQUARE"
            ld.size = size
        else:
            ld.shape = "RECTANGLE"
            ld.size = size
            ld.size_y = size_y
        ob = link(bpy.data.objects.new(name, ld))
        ob.location = loc
        d = Vector(target) - Vector(loc)
        ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        return ob

    area("Softbox", (-4.5, -6.0, 7.5), (0, 0, 0.4), 2600, 6.0)
    area("Rim", (4.5, 5.5, 3.2), (0, 0, 0.6), 1800, 7.0, 0.8, color="#FFFFFF")
    area("Fill", (6.0, -6.5, 2.0), (0, 0, 0.5), 220, 4.0, color="#F4F6FA")


# ----------------------------------------------------------------- 애니메이션 헬퍼

def fcurves_of(obj):
    from bpy_extras import anim_utils
    ad = obj.animation_data
    bag = anim_utils.action_get_channelbag_for_slot(ad.action, ad.action_slot)
    return bag.fcurves


def key(obj, path, frame, value, index=None):
    """value 가 스칼라면 index 채널 하나, 튜플이면 전 채널."""
    if index is None:
        setattr(obj, path, value)
        obj.keyframe_insert(path, frame=frame)
    else:
        getattr(obj, path)[index] = value
        obj.keyframe_insert(path, index=index, frame=frame)


def set_handles(obj, path, index, frames, handle="VECTOR"):
    for fc in fcurves_of(obj):
        if fc.data_path == path and fc.array_index == index:
            for kp in fc.keyframe_points:
                if any(abs(kp.co.x - f) < 0.01 for f in frames):
                    kp.handle_left_type = handle
                    kp.handle_right_type = handle
            fc.update()


def squash_key(squash, frame, sz):
    """부피 보존 스쿼시/스트레치."""
    sxy = 1.0 / math.sqrt(sz)
    key(squash, "scale", frame, (sxy, sxy, sz))


# ----------------------------------------------------------------- 안무

# (도약 프레임, 착지 프레임, 착지 위치 xyz, 점프 높이, 착지한 키 인덱스 또는 None)
HOPS = [
    (4, 16, (-4.8, 0.0, 0.0), 0.85, None),
    (22, 38, (KEY_XS[0], 0.0, KEY_TOP), 0.9, 0),
    (46, 62, (KEY_XS[1], 0.0, KEY_TOP), 0.8, 1),
    (70, 86, (KEY_XS[2], 0.0, KEY_TOP), 0.8, 2),
    (96, 126, (0.0, -2.25, 0.0), 1.9, None),
]
START = (-6.7, 0.0, 0.0)
YAW_TRAVEL = math.radians(42)   # 진행 방향(+X)을 보되 카메라 쪽으로 살짝 튼 얼굴
SETTLE_END = 150


def animate(root, squash, eyes, keys):
    pos = START
    contact_frames_z = [1]
    key(root, "location", 1, START)
    key(root, "rotation_euler", 1, (0, 0, YAW_TRAVEL))
    squash_key(squash, 1, 1.0)
    key(squash, "rotation_euler", 1, (0, 0, 0))

    prev_land = 1
    for n, (t0, t1, land, h, key_idx) in enumerate(HOPS):
        last = n == len(HOPS) - 1
        # 이전 착지점의 키가 도약 순간 아직 눌려 있음 → 그만큼 낮은 곳에서 출발
        prev_key = HOPS[n - 1][4] if n > 0 else None
        z0 = pos[2] - (0.05 if prev_key is not None else 0.0)

        # 접지 구간: 착지 → 최대로 눌림 → 도약 전 예비 동작
        if n > 0:
            if prev_key is not None:
                key(root, "location", prev_land + 4, pos[2] - PRESS, index=2)
            squash_key(squash, prev_land + 3, 0.62)
            squash_key(squash, prev_land + 6, 0.92)
        squash_key(squash, t0 - 2, 0.74)  # 웅크림
        key(root, "location", t0, (pos[0], pos[1], z0))
        contact_frames_z.append(t0)
        key(squash, "rotation_euler", t0 - 2, (0, -math.radians(4), 0))

        # 공중: 도약하며 늘어남 → 정점에서 원형 → 착지 직전 다시 늘어남
        squash_key(squash, t0 + 2, 1.28)
        apex_f = (t0 + t1) / 2
        squash_key(squash, round(apex_f), 1.02)
        squash_key(squash, t1 - 1, 1.16)
        key(squash, "rotation_euler", t0 + 3, (0, math.radians(9), 0))
        key(squash, "rotation_euler", round(apex_f), (0, 0, 0))
        key(squash, "rotation_euler", t1 - 1, (0, -math.radians(5), 0))
        key(squash, "rotation_euler", t1 + 4, (0, 0, 0))

        apex_z = max(z0, land[2]) + h
        key(root, "location", round(apex_f), apex_z, index=2)
        key(root, "location", t1, land)
        contact_frames_z.append(t1)
        if last:
            # 공중에서 몸을 돌려 관객을 보고 착지
            key(root, "rotation_euler", t0 + 2, YAW_TRAVEL, index=2)
            key(root, "rotation_euler", t1 - 3, 0.0, index=2)

        # 밟힌 키: 눌림 → 다음 도약 때 튀어 오름 → 스프링 오버슈트
        if key_idx is not None:
            k = keys[key_idx]
            base = k.location.z
            next_t0 = HOPS[n + 1][0]
            key(k, "location", t1 - 1, base, index=2)
            key(k, "location", t1 + 4, base - PRESS, index=2)
            key(k, "location", next_t0, base - 0.05, index=2)
            key(k, "location", next_t0 + 4, base + 0.035, index=2)
            key(k, "location", next_t0 + 8, base - 0.012, index=2)
            key(k, "location", next_t0 + 12, base, index=2)

        pos = land
        prev_land = t1

    # 마지막 착지 뒤 젤리 여진
    L = HOPS[-1][1]
    for df, sz in ((3, 0.6), (7, 1.12), (11, 0.95), (15, 1.03), (19, 0.99), (24, 1.0)):
        squash_key(squash, L + df, sz)
    squash_key(squash, FRAMES, 1.0)
    key(root, "location", FRAMES, pos)

    # 접지 순간은 속도가 꺾이는 곳: z 커브를 각지게(벡터 핸들), 정점은 부드럽게
    set_handles(root, "location", 2, contact_frames_z, "VECTOR")

    # 눈 깜빡임 두 번(두 번째는 짧게)
    for eye in eyes:
        sz = eye.scale.z
        for f, s in ((1, 1), (156, 1), (158, 0.1), (161, 1), (166, 1), (168, 0.1), (170, 1)):
            key(eye, "scale", f, s * sz, index=2)


def build_camera(root):
    scene = bpy.context.scene
    pivot = empty("CamPivot")
    cd = bpy.data.cameras.new("Camera")
    cd.lens = 50
    cd.sensor_fit = "VERTICAL"
    cd.sensor_height = 36
    cd.clip_end = 200
    cam = link(bpy.data.objects.new("Camera", cd))
    cam.parent = pivot
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.camera = cam

    # 초점: 캐릭터를 따라가다 마지막에는 캐릭터와 글자 사이에 맞춤
    focus = empty("Focus")
    c = focus.constraints.new("COPY_LOCATION")
    c.target = root
    focus.location = (0, -1.5, 0.6)
    cd.dof.use_dof = True
    cd.dof.focus_object = focus
    cd.dof.aperture_fstop = 1.4
    cd.dof.aperture_blades = 7
    cd.dof.aperture_rotation = math.radians(10)
    c.influence = 1.0
    c.keyframe_insert("influence", frame=96)
    c.influence = 0.0
    c.keyframe_insert("influence", frame=126)

    def cam_key(f, pivot_loc, az, elev, dist):
        key(pivot, "location", f, pivot_loc)
        key(pivot, "rotation_euler", f, (math.radians(-elev), 0, math.radians(az)))
        key(cam, "location", f, (0, -dist, 0))

    cam_key(1, (-3.4, -0.3, 0.5), 18, 30, 10.0)
    cam_key(40, (-1.7, -0.3, 0.5), 17, 31, 10.4)
    cam_key(86, (0.9, -0.3, 0.5), 15, 33, 11.4)
    cam_key(142, (0.0, -0.35, 0.4), 0, 40, 16.6)
    cam_key(FRAMES, (0.0, -0.35, 0.4), 0, 40, 16.3)  # 아주 느린 밀어 넣기로 정지 화면 방지
    return cam


# ----------------------------------------------------------------- 렌더 설정

def setup_render(preview):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    cy = scene.cycles
    prefs = bpy.context.preferences.addons["cycles"].preferences
    device = "CPU"
    for backend in ("METAL", "OPTIX", "CUDA", "HIP", "ONEAPI"):
        try:
            prefs.compute_device_type = backend
        except TypeError:
            continue
        prefs.refresh_devices()
        gpus = [d for d in prefs.devices if d.type == backend]
        if gpus:
            for d in prefs.devices:
                d.use = d.type == backend
            device = "GPU"
            break
    cy.device = device
    print(f"[scene] Cycles device: {device} ({prefs.compute_device_type})")

    cy.samples = 12 if preview else 40
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.04 if preview else 0.02
    cy.use_denoising = True
    cy.denoiser = "OPENIMAGEDENOISE"
    cy.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    cy.max_bounces = 6
    cy.diffuse_bounces = 3
    cy.glossy_bounces = 3
    cy.transmission_bounces = 4
    cy.transparent_max_bounces = 4
    cy.caustics_reflective = False
    cy.caustics_refractive = False
    cy.blur_glossy = 1.0
    scene.render.use_persistent_data = True
    scene.render.use_motion_blur = True
    scene.render.motion_blur_shutter = 0.5
    scene.render.resolution_percentage = 50 if preview else 100

    vs = scene.view_settings
    # AgX 는 #FF5A1F 같은 고채도 주황을 바래게 함 → 베이스 색을 지키는 PBR Neutral
    vs.view_transform = "Khronos PBR Neutral"
    vs.look = "None"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.compression = 15


def main():
    opts = parse_args()
    reset_scene()
    mats = make_materials()
    build_cyclorama(mats["floor"])
    _, keys = build_keys(mats)
    root, squash, body, eyes = build_character(mats)
    animate(root, squash, eyes, keys)
    build_lights()
    build_camera(root)
    setup_render(opts["preview"])
    scene = bpy.context.scene

    if opts["save"]:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(opts["save"]))

    out = os.path.abspath(opts["out"])
    os.makedirs(out, exist_ok=True)
    if opts["frames"]:
        for f in opts["frames"]:
            scene.frame_set(f)
            scene.render.filepath = os.path.join(out, f"frame_{f:04d}.png")
            bpy.ops.render.render(write_still=True)
            print(f"[scene] wrote frame {f}")
    else:
        scene.render.filepath = os.path.join(out, "frame_")
        bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
