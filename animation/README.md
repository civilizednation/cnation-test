# 문명국 3D 애니메이션 (코드만으로)

Blender UI를 한 번도 열지 않고 `scene.py` 하나로 장면·재질·조명·카메라·애니메이션을 만들고 헤드리스로 렌더합니다.
계획은 [PLAN.md](PLAN.md)에 있습니다.

| 파일 | 내용 |
|---|---|
| `scene.py` | 장면 전체(bpy). `--preview` 는 50% 해상도·저샘플로 30프레임마다 한 장 |
| `render.sh` | 전체 렌더 → `output.mp4`(H.264), 시간 → `render_time.txt` |
| `fonts/Pretendard-ExtraBold.otf` | 한글 폰트 (Pretendard, SIL Open Font License 1.1) |
| `munmyeongguk.blend` | Blender 5.0+ 에서 열어 편집·렌더할 수 있는 장면 파일 (폰트 포함) |
| `output.mp4` | 결과 영상, 720x1280, 30fps, 6초 |
| `render_time.txt` | `프레임 수, 걸린 분` |

## 실행

```bash
# Blender 설치본 (맥은 Metal GPU를 자동으로 잡음)
BLENDER=/Applications/Blender.app/Contents/MacOS/Blender ./render.sh

# 또는 pip 판 bpy (Python 3.11)
python3.11 -m pip install bpy
PYTHON=python3.11 ./render.sh

# .blend 만 다시 만들기
blender -b -P scene.py -- --save munmyeongguk.blend --no-render

# 미리보기만
blender -b -P scene.py -- --preview --out preview
```

GPU는 Metal → OptiX → CUDA → HIP → oneAPI 순서로 찾고, 없으면 CPU로 렌더합니다.
