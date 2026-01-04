---
description: Use the Gemini CLI as a subagent for context-efficient analysis tasks
---

// turbo-all

# Gemini CLI Subagent Workflow

The Gemini CLI is installed and can be used as a "subagent" to offload analysis tasks, saving your context window for synthesis and implementation.

## When to Use

✅ **Good use cases:**
- Bulk analysis of multiple files (maintainability, security, performance)
- Generating documentation or test cases from code
- Summarizing large documents or codebases
- Tasks that don't need deep project context
- Screening passes before deep-dive analysis

❌ **Avoid for:**
- Tasks requiring cross-file understanding
- Work that needs your conversation history
- Quick single-file edits
- Tasks where you need to see the full output immediately
- When you'll implement fixes immediately (you'll need to read the code anyway)

## Is It Worth It? (Context Economics)

### Typical Savings
Analyzing 3 files (~43KB source) via CLI uses ~5.5K tokens (analysis output only) vs ~14.5K tokens (reading source directly). **~3x context savings** for pure analysis.

### When It's Worth the Overhead
| Situation | Worth It? | Why |
|-----------|-----------|-----|
| Deep in 50+ message conversation | ✅ Yes | Context is precious, offload bulk work |
| Analyzing 5+ files for patterns | ✅ Yes | Parallel execution saves time |
| Fresh conversation, plenty of context | ❌ No | Overhead outweighs savings |
| Will implement fixes after analysis | ❌ No | Need to read code anyway |
| Need cross-file understanding | ❌ No | Each subagent is isolated |

### Important Caveats

> ⚠️ **User approval always required**: Even with `SafeToAutoRun: true` and `// turbo-all`, the platform requires manual approval for `gemini` CLI commands because they make external API calls. This is a system-level safety feature that cannot be bypassed.

> 💡 **Tip**: Write temp files directly to `reports/` with a `_temp_` prefix (e.g., `reports/_temp_analysis.txt`). This folder is not gitignored, so files are directly readable via `view_file`. Delete temp files after synthesizing into the final report.

## How to Use

### Setup
No setup required - write directly to `reports/` folder with `_temp_` prefix.

### Basic Pattern
```powershell
// turbo
gemini -p "Your prompt here. Be specific and actionable." > reports/_temp_output.txt 2>&1
```

### Recommended Prompt Structure
```
Analyze [FILE_PATH] for [SPECIFIC_CONCERN]. Focus on:
1) [Criterion 1]
2) [Criterion 2]  
3) [Criterion 3]
Be concise and actionable.
```

### Example: Maintainability Analysis
```powershell
// turbo
gemini -p "Analyze src/data_store.py for maintainability issues. Focus on: 1) Functions too long, 2) Code duplication, 3) Poor naming, 4) Missing error handling, 5) Tight coupling. Be concise and actionable." > reports/_temp_analysis_datastore.txt 2>&1
```

### Example: Security Review
```powershell
// turbo
gemini -p "Review src/common.py for security vulnerabilities. Focus on: 1) SQL injection, 2) Path traversal, 3) Credential exposure, 4) Input validation. Be specific about line numbers." > reports/_temp_security_review.txt 2>&1
```

### Example: Generate Tests
```powershell
// turbo
gemini -p "Generate pytest unit tests for the functions in src/config_loader.py. Include edge cases and mock dependencies." > reports/_temp_tests_config_loader.txt 2>&1
```

### Parallel Execution (Multiple Subagents)
To analyze multiple files simultaneously, invoke multiple `run_command` calls in the same turn:

```
# In a single tool call block, run these in PARALLEL (no waitForPreviousTools):
gemini -p "Analyze src/common.py..." > reports/_temp_common.txt 2>&1
gemini -p "Analyze src/data_store.py..." > reports/_temp_datastore.txt 2>&1  
gemini -p "Analyze src/analytics.py..." > reports/_temp_analytics.txt 2>&1
```

Each runs as a background command. Then use `command_status` to wait for all to complete before reading results.

**Benefits:**
- 5 files analyzed in ~3 min instead of ~15 min
- All subagents run independently with fresh context
- Agent synthesizes results after all complete

### Cleanup (run when done)
```powershell
// turbo
Remove-Item reports/_temp_*.txt
```

## Execution Notes

1. **Always redirect output to a file** - CLI output can be truncated otherwise
2. **Wait for completion** - Commands take 2-4 minutes typically
3. **View the output file** after completion to read results
4. **Clean up temp files** when done: `Remove-Item analysis_*.txt`
5. **The CLI uses Gemini 3** which provides good analysis quality

## Performance

| Metric | Typical Value |
|--------|---------------|
| Startup time | ~500-800ms |
| Analysis time | 1-3 minutes |
| Output size | 3-5KB per file |

## Synthesis Pattern

After running multiple subagent analyses:
1. Read each output file
2. Synthesize common themes and unique findings
3. Add your own deep-dive insights for critical files
4. Create consolidated report in `reports/` folder

## Version Info

- **Model**: Gemini 3 (as of 2025-12-21)
- **Installation**: `npm install -g @anthropic/gemini-cli` (user managed)
