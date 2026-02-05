# Jian Yang Matrix Workflow

ComfyUI workflows for transforming Jian Yang character videos into Matrix-style CRT aesthetic content.

## 🎯 Objective

Create visually striking Matrix-inspired effects while preserving character recognition (Jian Yang must remain identifiable).

## 🏗️ Architecture

### Workflow Pipeline

1. **Outline Extraction** → Extract character edges/silhouette
2. **Matrix Effect** → Apply falling code aesthetic
3. **CRT Post-Processing** → Add retro monitor effects

### Preservation Strategy

- **Character Recognition Priority**: All effects layer ON TOP of recognizable character
- **Edge Detection**: Preserve facial features and body outline
- **Opacity Balance**: Matrix code doesn't obscure identity

## 📁 Repository Structure

```
jianyang-matrix-workflow/
├── workflows/
│   ├── 01_outline_extraction.json       # Character edge detection
│   ├── 02_matrix_effect.json            # Matrix code overlay
│   ├── 03_crt_aesthetic.json            # CRT/scanline effects
│   └── full_pipeline.json               # Complete workflow
├── examples/
│   └── reference_outputs/               # Example outputs
├── docs/
│   └── WORKFLOW_DESIGN.md              # Technical design notes
└── README.md
```

## ⚙️ Workflows

### 1. Outline Extraction (`01_outline_extraction.json`)

**Purpose**: Extract character edges while preserving facial features

**Key Nodes**:
- LoadVideo → Input source
- EdgeDetection → Canny/Sobel edge detection
- Threshold → Adjust edge sensitivity
- AlphaComposite → Merge with original

**Parameters**:
- Edge threshold: 0.3-0.5 (preserve facial details)
- Line weight: 2-4px
- Color: Neon green (#00FF41) or terminal green

### 2. Matrix Effect (`02_matrix_effect.json`)

**Purpose**: Apply Matrix falling code aesthetic

**Key Nodes**:
- MatrixCodeGenerator → Generate falling characters
- Blend → Composite with outline
- ColorGrade → Matrix green palette
- DepthMask → Code density based on depth/edges

**Parameters**:
- Code density: 40-60% (allow character visibility)
- Fall speed: 15-30 fps
- Opacity: 70-85% (character shows through)

### 3. CRT Aesthetic (`03_crt_aesthetic.json`)

**Purpose**: Add retro terminal monitor effects

**Key Nodes**:
- Scanlines → Horizontal lines (2-4px spacing)
- ChromaticAberration → RGB offset
- Glow → Terminal phosphor glow
- Vignette → CRT screen curvature

**Parameters**:
- Scanline opacity: 20-40%
- Glow radius: 4-8px
- Curvature: Slight barrel distortion

### Full Pipeline (`full_pipeline.json`)

Chains all three workflows with optimized parameters for character preservation.

## 🚀 Setup

### Prerequisites

```bash
# ComfyUI server running
curl http://localhost:8188

# Required custom nodes (install via ComfyUI Manager)
- ComfyUI-VideoHelperSuite
- ComfyUI-Image-Filters
- ComfyUI-Advanced-ControlNet (for edge detection)
```

### Installation

```bash
# Clone workflows
cd ~/clawd/repos/jianyang-matrix-workflow

# Copy workflows to ComfyUI
cp workflows/*.json ~/ComfyUI/user/default/

# Or use via API
python scripts/run_pipeline.py --input video.mp4 --output matrix_output.mp4
```

## 📊 Usage

### Via ComfyUI UI

1. Open ComfyUI web interface (http://localhost:8188)
2. Load workflow: `Load → jianyang-matrix-workflow/workflows/full_pipeline.json`
3. Set input video path
4. Adjust parameters (see Parameter Guide below)
5. Queue Prompt

### Via API

```python
import requests
import json

# Load workflow
with open('workflows/full_pipeline.json') as f:
    workflow = json.load(f)

# Set input
workflow['nodes']['input_video']['inputs']['video_path'] = 'input.mp4'

# Queue job
response = requests.post('http://localhost:8188/prompt', json={
    'prompt': workflow
})

print(f"Job ID: {response.json()['prompt_id']}")
```

## 🎨 Parameter Guide

### Character Visibility (CRITICAL)

| Parameter | Range | Recommended | Purpose |
|-----------|-------|-------------|---------|
| Edge Threshold | 0.1-0.7 | 0.3-0.5 | Lower = more detail preserved |
| Matrix Opacity | 50-100% | 70-85% | Character shows through |
| Code Density | 20-80% | 40-60% | Balance aesthetic vs clarity |
| Glow Intensity | 0-10 | 4-6 | Terminal effect without blur |

### Quality vs Speed

- **High Quality**: 1080p, 30fps, edge threshold 0.3, code density 50%
- **Fast Preview**: 720p, 15fps, edge threshold 0.5, code density 40%

## 🔬 Research Integration

**Status**: ⏳ PRELIMINARY WORKFLOWS - PENDING MATRIX_RESEARCH FINDINGS

These workflows are initial drafts based on Matrix aesthetic principles. Final parameters and node configurations will be adjusted after MATRIX_RESEARCH completes analysis of:

- Optimal edge detection methods for character preservation
- Matrix code density thresholds for readability
- CRT effect intensity that maintains clarity
- Color grading that preserves facial features

## 🎬 Example Outputs

(Pending workflow testing and MATRIX_RESEARCH findings)

Expected outputs in `examples/reference_outputs/` after finalization.

## 🐛 Troubleshooting

### Character Not Visible

- Reduce matrix code opacity (try 60-70%)
- Increase edge threshold (0.4-0.5)
- Lower code density (30-40%)

### Matrix Effect Too Subtle

- Increase code density (60-70%)
- Boost green color saturation
- Add more glow (6-8px radius)

### Performance Issues

- Lower resolution (720p for testing)
- Reduce code particle count
- Process in batches (split video)

## 📝 Next Steps

1. ✅ Repository structure created
2. ⏳ Await MATRIX_RESEARCH findings
3. ⏳ Refine workflows based on research
4. ⏳ Generate example outputs
5. ⏳ Parameter optimization testing
6. ⏳ Integration with KDH content pipeline

## 🔗 Related Repositories

- **MATRIX_RESEARCH**: Research findings on Matrix aesthetics
- **KDH-Automation**: Main content generation pipeline
- **nanobanana-pro-cli**: Character assets and profiles

---

**Last Updated**: 2026-02-05  
**Status**: Draft workflows pending research findings  
**Maintainer**: Subagent WORKFLOW_DESIGNER
