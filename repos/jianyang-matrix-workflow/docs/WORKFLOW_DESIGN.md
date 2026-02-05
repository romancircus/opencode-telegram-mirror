# Workflow Design Notes

## Design Philosophy

**Primary Goal**: Transform Jian Yang character videos into Matrix-style content while preserving character recognition.

**Constraint**: Character identity must never be obscured. Effects are secondary to visibility.

## Technical Approach

### 1. Layered Effect System

Effects stack in this order:
1. Original character (base layer) - ALWAYS visible
2. Edge outline (enhancement)
3. Matrix code (overlay with depth masking)
4. CRT effects (post-processing)

### 2. Depth-Aware Masking

**Problem**: Uniform Matrix code overlay obscures character face  
**Solution**: Use depth estimation to reduce code density over near objects (character) while increasing density in background

**Implementation**:
- Depth map from MiDaS v2.1 or ZoeDepth
- Near plane (character): 30-40% code opacity
- Far plane (background): 75-85% code opacity
- Smooth gradient transition

### 3. Edge Preservation

**Problem**: Heavy effects can blur facial features  
**Solution**: Multi-scale edge detection preserving fine details

**Implementation**:
- Canny edge detection with low threshold (0.3-0.5)
- Preserve both strong edges (body outline) and weak edges (facial features)
- Edge enhancement with controlled line weight (2-4px)

## Node Requirements

### Critical Nodes (Must Have)

1. **LoadVideo** - Video input
2. **CannyEdgeDetection** - Character outline extraction
3. **MatrixCodeGenerator** - Falling code animation (custom or shader-based)
4. **DepthEstimation** - MiDaS/ZoeDepth for depth masking
5. **DepthMaskedBlend** - Opacity based on depth
6. **Scanlines** - CRT horizontal lines
7. **ChromaticAberration** - RGB separation
8. **SaveVideo** - Output

### Optional Enhancements

- **BarrelDistortion** - Screen curvature
- **Vignette** - Edge darkening
- **GlowEffect** - Terminal phosphor glow
- **GrainOverlay** - Film grain
- **PixelFlicker** - CRT flicker

## Color Palette

### Matrix Green
- Primary: `#00FF41` (terminal green)
- Highlights: `#00FF41` (bright code)
- Midtones: `#008F11` (standard text)
- Shadows: `#001100` (background)
- Accent: `#FFFFFF` (bright flash)

### CRT Characteristics
- Slight green tint overall
- Glow/bloom on bright elements
- Desaturated blacks (CRT phosphor never truly black)

## Performance Considerations

### Processing Pipeline

**Sequential Processing** (per frame):
1. Edge detection (GPU) - ~5ms
2. Depth estimation (GPU) - ~20ms
3. Matrix code generation (CPU/GPU) - ~10ms
4. Compositing (GPU) - ~5ms
5. CRT effects (GPU) - ~8ms

**Total**: ~48ms/frame = ~20fps processing speed on RTX 5090

### Optimization Strategies

1. **Batch Processing**: Process 8-16 frames in parallel
2. **Caching**: Depth map changes slowly, cache for 2-3 frames
3. **Resolution Scaling**: Preview at 720p, final at 1080p
4. **Effect LOD**: Reduce grain/flicker intensity for faster processing

## Parameter Tuning Guide

### Critical Parameters (Character Visibility)

| Parameter | Impact on Visibility | Safe Range | Notes |
|-----------|---------------------|------------|-------|
| Edge Low Threshold | Higher = less detail | 0.3-0.5 | Too low = noisy, too high = lost features |
| Matrix Near Opacity | Higher = obscured face | 0.25-0.45 | NEVER exceed 0.5 |
| Matrix Density | Higher = cluttered | 0.4-0.6 | Sweet spot around 0.5 |
| Glow Radius | Higher = blur | 4-8px | Keep under 10px |

### Aesthetic Parameters (Less Critical)

| Parameter | Impact | Range | Notes |
|-----------|--------|-------|-------|
| Scanline Opacity | CRT visibility | 0.2-0.4 | 0.3 = classic CRT look |
| Chromatic Aberration | Color separation | 1-4px | 2px = subtle, 4px = pronounced |
| Barrel Distortion | Screen curve | 0.05-0.15 | 0.08 = realistic CRT |
| Vignette Strength | Edge darkening | 0.3-0.6 | 0.4 = balanced |

## Testing Protocol

### Phase 1: Component Testing
1. Test edge detection on 3-5 frames with varying lighting
2. Test Matrix code generation independently
3. Test depth masking accuracy
4. Test each CRT effect in isolation

### Phase 2: Integration Testing
1. Run 5-second clip through stage 1 only
2. Run through stages 1+2
3. Run full pipeline
4. Compare character visibility at each stage

### Phase 3: Parameter Sweep
1. Test 3 edge threshold values (0.3, 0.4, 0.5)
2. Test 3 matrix density values (0.4, 0.5, 0.6)
3. Test 3 near opacity values (0.3, 0.35, 0.4)
4. Select optimal combination

### Success Metrics
- Character face clearly recognizable in all frames
- Matrix aesthetic present but not overwhelming
- CRT effects add atmosphere without distraction
- Processing time <3x video duration

## Common Failure Modes

### Face Obscured by Matrix Code
**Symptoms**: Character features blurred or hidden  
**Fix**: Reduce near_opacity to 0.25-0.3, reduce density to 0.4

### Edge Detection Too Aggressive
**Symptoms**: Noisy outlines, character looks sketchy  
**Fix**: Increase low_threshold to 0.4-0.5

### CRT Effects Too Strong
**Symptoms**: Hard to watch, eye strain  
**Fix**: Reduce scanline opacity to 0.2, reduce chromatic aberration to 1-2px

### Performance Issues
**Symptoms**: Processing too slow  
**Fix**: Reduce resolution to 720p, batch process, cache depth maps

## Research Questions (Pending MATRIX_RESEARCH)

1. **Optimal edge detection method**: Canny vs Sobel vs Holistically-Nested Edge Detection?
2. **Matrix code density threshold**: What's the maximum density before character recognition drops?
3. **CRT effect intensity**: How strong can CRT effects be before they impair visibility?
4. **Color grading impact**: Does pure green (#00FF41) preserve facial features better than mixed palette?
5. **Frame rate impact**: Can we reduce to 24fps for stylistic effect without losing quality?

## Future Enhancements

### V2 Features (Post-Research)
- [ ] Audio-reactive Matrix code (code falls sync to music beats)
- [ ] Character-aware code generation (code avoids face entirely in some frames)
- [ ] Multiple color schemes (blue "code" mode, amber terminal mode)
- [ ] Dynamic effect intensity (effects intensify/reduce based on scene)
- [ ] Real-time preview mode (< 1s latency)

### Integration Points
- [ ] KDH-Automation pipeline integration
- [ ] Automated batch processing for series content
- [ ] Template system for different character styles
- [ ] QA validation (automated face detection check)

---

**Status**: Draft design pending research validation  
**Last Updated**: 2026-02-05  
**Author**: Subagent WORKFLOW_DESIGNER
