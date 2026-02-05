# Pending Research Items

This document tracks what we're waiting for from MATRIX_RESEARCH before finalizing workflows.

## Status: ⏳ AWAITING MATRIX_RESEARCH FINDINGS

## Critical Research Questions

### 1. Edge Detection Method
**Question**: Which edge detection algorithm best preserves character recognition?

**Options to evaluate**:
- Canny (current draft choice)
- Sobel
- Holistically-Nested Edge Detection (HED)
- Multi-scale edge detection

**What we need**:
- Comparative analysis on sample Jian Yang frames
- Threshold ranges that preserve facial features
- Performance benchmarks

### 2. Matrix Code Density Threshold
**Question**: What's the maximum code density before character becomes unrecognizable?

**What we need**:
- Test results for density range 0.3-0.8
- Character recognition scores at each density
- Recommended safe range

### 3. Depth Masking Effectiveness
**Question**: Does depth-aware masking actually preserve character better than uniform opacity?

**What we need**:
- A/B comparison: depth masked vs uniform
- Optimal near/far opacity ratios
- Validation that character face stays visible

### 4. CRT Effect Intensity Limits
**Question**: How strong can CRT effects be before impairing visibility?

**What we need**:
- Scanline opacity upper limit
- Chromatic aberration pixel offset limit
- Combined effect intensity testing

### 5. Color Grading Impact
**Question**: Does pure Matrix green preserve facial features better than mixed palette?

**What we need**:
- Comparison of color schemes:
  - Pure #00FF41 (terminal green)
  - Mixed green palette (highlights/midtones/shadows)
  - Desaturated vs saturated
- Impact on character recognition

### 6. Frame Rate Considerations
**Question**: Can we reduce to 24fps for aesthetic without quality loss?

**What we need**:
- 24fps vs 30fps comparison
- Motion smoothness evaluation
- Matrix code fall speed adjustment for lower fps

## Implementation Blockers

### Workflow Finalization
**Blocked until**:
- Edge detection method confirmed
- Matrix density safe range established
- CRT effect limits determined

### Parameter Optimization
**Blocked until**:
- Research provides recommended ranges
- Test results validate preservation strategy

### Example Generation
**Blocked until**:
- Workflows finalized with research-backed parameters
- Can process sample videos confidently

## Interim State

**Current workflows**: DRAFT status, preliminary parameters based on:
- Matrix movie aesthetics observation
- CRT monitor technical specs
- Conservative values favoring character visibility

**Use at your own risk**: Current parameters are educated guesses, not validated.

**Recommended action**: Wait for MATRIX_RESEARCH findings before processing production content.

## Next Steps After Research

1. ✅ Receive MATRIX_RESEARCH findings
2. ⏳ Update workflow parameters based on research
3. ⏳ Generate test outputs with optimized settings
4. ⏳ Validate character recognition preservation
5. ⏳ Create example outputs for documentation
6. ⏳ Mark workflows as STABLE
7. ⏳ Integrate with KDH-Automation pipeline

---

**Created**: 2026-02-05  
**Waiting for**: MATRIX_RESEARCH subagent completion  
**Contact**: Main agent session for research status
