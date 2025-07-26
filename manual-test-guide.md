# Manual Testing Guide for Workout Modes AI Generation

## Test Setup ✅
- Server running on port 3007
- Test page available at `/test-genkit`
- AI generation function implemented
- Test data prepared

## Expected Results for Each Mode

### 🐌 CRAWL MODE (Easier)
**Expected Behavior:**
- **Blank Count**: Should INCREASE from 2 to 3-4 blanks
- **Complexity**: Break down expressions into smaller parts
- **Example Transformation**:
  ```python
  # Original:
  name = ____
  age = ____
  
  # Crawl Mode:
  name = ____
  age = ____
  print(____ + ____ + ____)  # More granular blanks
  ```

### 🚶 WALK MODE (Baseline)
**Expected Behavior:**
- **Blank Count**: Should MAINTAIN exactly 2 blanks
- **Complexity**: No changes - return original content
- **Example**: Identical to original drill content

### 🏃 RUN MODE (Harder)
**Expected Behavior:**
- **Blank Count**: Should DECREASE from 2 to 1 blank
- **Complexity**: Combine multiple concepts into larger blanks
- **Example Transformation**:
  ```python
  # Original:
  name = ____
  age = ____
  
  # Run Mode:
  ____ # Entire variable assignment block
  print(f"Hello, my name is {name} and I am {age} years old")
  ```

## Test Execution Steps

### Step 1: Open Test Page
1. Navigate to `http://localhost:3007/test-genkit`
2. Look for the "Test Workout Modes AI" button

### Step 2: Run the Test
1. Click "Test Workout Modes AI" (no input needed)
2. Wait for processing (may take 10-30 seconds)
3. Watch for the results to appear

### Step 3: Analyze Results
Look for these key metrics in the output:

```
=== CRAWL MODE ===
⏱️  Generation Time: [time]ms
📊 Blanks: 2 → [should be 3-4] (+[positive number])
📝 Sample Code: [should show more granular blanks]
🔧 Solutions: [should have more solutions]
✅ Status: SUCCESS

=== WALK MODE ===
⏱️  Generation Time: [time]ms
📊 Blanks: 2 → 2 (0)
📝 Sample Code: [should be identical to original]
🔧 Solutions: ["Alice", 25]
✅ Status: SUCCESS

=== RUN MODE ===
⏱️  Generation Time: [time]ms
📊 Blanks: 2 → 1 (-1)
📝 Sample Code: [should show combined blanks]
🔧 Solutions: [should have fewer, more complex solutions]
✅ Status: SUCCESS
```

### Step 4: Validate Success Criteria

#### ✅ PASS Criteria:
- **Crawl Mode**: Blank count increases (2 → 3 or 4)
- **Walk Mode**: Blank count unchanged (2 → 2)
- **Run Mode**: Blank count decreases (2 → 1)
- **All Modes**: Solution arrays match blank counts
- **All Modes**: Generation time < 30 seconds
- **All Modes**: Status shows "SUCCESS"

#### ❌ FAIL Criteria:
- Blank counts change in wrong direction
- Solution array length doesn't match blank count
- Generation fails with errors
- Content becomes nonsensical

## Troubleshooting

### If Tests Fail:
1. **Check Console**: Look for error messages in browser dev tools
2. **Check Server Logs**: Look at the terminal running the dev server
3. **Verify API Key**: Ensure GOOGLE_API_KEY is set in .env.local
4. **Network Issues**: Check if AI service is accessible

### Common Issues:
- **Timeout**: AI generation taking too long (increase timeout)
- **Parse Error**: AI returning invalid JSON (check prompts)
- **Rate Limiting**: Too many requests to AI service (wait and retry)

## Success Indicators

When the test completes successfully, you should see:

```
📋 SUMMARY: 3/3 tests passed

🔍 MODE ANALYSIS:
Crawl: ✅ Correctly increased difficulty (more blanks)
Walk: ✅ Correctly maintained original content
Run: ✅ Correctly decreased blanks (higher difficulty)
```

## Next Steps After Testing

Once tests pass:
1. ✅ Mark task 8.1 as complete
2. 🚀 Move to task 8.2 (Test interactive code editing functionality)
3. 📝 Document any issues found
4. 🔧 Fix any failing test cases

---

**Ready to test!** 🎯 Go to `http://localhost:3007/test-genkit` and click "Test Workout Modes AI"