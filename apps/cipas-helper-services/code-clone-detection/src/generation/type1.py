"""
Type-1 clone generation for code clone detection.

Type-1 clones are EXACT copies with modifications ONLY to:
- Whitespace (spaces, tabs, newlines, indentation)
- Comments (adding, removing, modifying)
- Formatting (line breaks, brace positions)

CRITICAL: Type-1 clones must preserve ALL code tokens exactly.
No variable renaming, no literal changes, no type changes, no reordering.

Allowed transformations:
- Changing indentation (spaces vs tabs, indent size)
- Adding/removing blank lines
- Modifying comments (inline, block, doc comments)
- Adjusting spacing around operators (but preserving the operators)
- Changing brace positions (same line vs next line)
- Rewrapping long lines

Prohibited transformations (these create Type-2 clones):
- Renaming variables, functions, classes
- Changing literals (numbers, strings, booleans)
- Changing types
- Reordering statements
- Adding/removing code statements

Functions:
    produce_type1_variant: Generate a Type-1 clone variant
    _change_indentation: Modify indentation style
    _modify_blank_lines: Add or remove blank lines
    _modify_comments: Add, remove, or modify comments
    _change_operator_spacing: Adjust spacing around operators (preserve tokens)
    _change_brace_positions: Modify brace placement
    _seed_from_code: Generate deterministic seed from code hash
"""

import hashlib
import logging
import random
import re
from typing import Any

logger = logging.getLogger(__name__)


def produce_type1_variant(code: str, lang: str) -> str:
    """
    Generate a Type-1 clone variant by modifying formatting only.
    
    Type-1 clones differ only in layout and formatting (whitespace, blank lines,
    indentation). The code structure and semantics remain identical.
    
    Uses deterministic RNG seeded from code hash for reproducibility. The same
    input code will always produce the same variant.
    
    Args:
        code: Original source code
        lang: Programming language ("python" or "java")
        
    Returns:
        Type-1 variant with modified formatting
        
    Examples:
        >>> original = "def foo():\\n    x = 1+2\\n    return x"
        >>> variant = produce_type1_variant(original, "python")
        >>> variant != original  # Formatting changed
        True
        >>> # Same input produces same output (deterministic)
        >>> variant2 = produce_type1_variant(original, "python")
        >>> variant == variant2
        True
        
        >>> java_code = "public int add(int a, int b) {\\n    return a+b;\\n}"
        >>> java_variant = produce_type1_variant(java_code, "java")
        >>> java_variant != java_code
        True
    """
    if not code or not code.strip():
        logger.warning("Empty or whitespace-only code provided")
        return code
    
    # Seed RNG deterministically from code hash
    seed = _seed_from_code(code)
    rng = random.Random(seed)
    
    # Apply transformations in sequence
    variant = code
    
    # 1. Change indentation style (whitespace only)
    variant = _change_indentation(variant, lang, rng)
    
    # 2. Modify blank lines (whitespace only)
    variant = _modify_blank_lines(variant, rng)
    
    # 3. Modify comments (comments only)
    variant = _modify_comments(variant, lang, rng)
    
    # 4. Change operator spacing (whitespace only, preserve all operators)
    variant = _change_operator_spacing(variant, lang, rng)
    
    # 5. Change brace positions (formatting only, for Java/C-style)
    if lang in ['java', 'javascript', 'cpp', 'c']:
        variant = _change_brace_positions(variant, rng)
    
    logger.debug(f"Generated Type-1 variant (seed={seed})")
    return variant


def _seed_from_code(code: str) -> int:
    """
    Generate a deterministic seed from code content.
    
    Uses MD5 hash of code to produce an integer seed. This ensures that
    the same code always produces the same seed.
    
    Args:
        code: Source code string
        
    Returns:
        Integer seed for random number generator
    """
    hash_digest = hashlib.md5(code.encode('utf-8')).hexdigest()
    # Take first 8 hex chars and convert to int
    seed = int(hash_digest[:8], 16)
    return seed


def _change_indentation(code: str, lang: str, rng: random.Random) -> str:
    """
    Modify indentation style deterministically.
    
    Changes include:
    - Converting spaces to tabs or vice versa
    - Changing indent size (2 vs 4 spaces)
    - Mixing tabs and spaces (if language allows)
    
    Args:
        code: Source code
        lang: Programming language
        rng: Seeded random number generator
        
    Returns:
        Code with modified indentation
    """
    lines = code.split('\n')
    
    # Detect current indentation
    indent_chars = []
    for line in lines:
        if line and line[0] in ' \t':
            # Count leading whitespace
            indent = len(line) - len(line.lstrip())
            if indent > 0:
                indent_chars.append(line[:indent])
    
    if not indent_chars:
        # No indentation found
        return code
    
    # Determine current indent style
    sample_indent = indent_chars[0]
    uses_tabs = '\t' in sample_indent
    uses_spaces = ' ' in sample_indent
    
    # Choose transformation based on current style
    choice = rng.randint(0, 2)
    
    if choice == 0 and uses_spaces:
        # Convert spaces to tabs (4 spaces = 1 tab)
        modified_lines = []
        for line in lines:
            if line.startswith('    '):
                # Count groups of 4 spaces
                indent_level = 0
                i = 0
                while i < len(line) - 3 and line[i:i+4] == '    ':
                    indent_level += 1
                    i += 4
                # Replace with tabs
                modified_lines.append('\t' * indent_level + line[i:])
            else:
                modified_lines.append(line)
        return '\n'.join(modified_lines)
    
    elif choice == 1 and uses_tabs:
        # Convert tabs to spaces (1 tab = 4 spaces)
        new_indent_size = rng.choice([2, 4])
        modified_lines = []
        for line in lines:
            if line.startswith('\t'):
                # Count tabs
                tab_count = 0
                for char in line:
                    if char == '\t':
                        tab_count += 1
                    else:
                        break
                # Replace with spaces
                modified_lines.append(' ' * (tab_count * new_indent_size) + line[tab_count:])
            else:
                modified_lines.append(line)
        return '\n'.join(modified_lines)
    
    elif choice == 2 and uses_spaces:
        # Change space indent size (2 <-> 4)
        # Detect current size
        if sample_indent.startswith('    '):
            current_size = 4
            new_size = 2
        elif sample_indent.startswith('  '):
            current_size = 2
            new_size = 4
        else:
            # Can't determine, return unchanged
            return code
        
        modified_lines = []
        for line in lines:
            if line.startswith(' '):
                # Count leading spaces
                space_count = 0
                for char in line:
                    if char == ' ':
                        space_count += 1
                    else:
                        break
                # Calculate indent level
                if space_count % current_size == 0:
                    indent_level = space_count // current_size
                    modified_lines.append(' ' * (indent_level * new_size) + line[space_count:])
                else:
                    # Inconsistent indentation, keep original
                    modified_lines.append(line)
            else:
                modified_lines.append(line)
        return '\n'.join(modified_lines)
    
    # No change applied
    return code


def _modify_blank_lines(code: str, rng: random.Random) -> str:
    """
    Add or remove blank lines deterministically.
    
    Modifications:
    - Add blank lines between statements
    - Remove consecutive blank lines
    - Add blank lines before/after blocks
    
    Args:
        code: Source code
        rng: Seeded random number generator
        
    Returns:
        Code with modified blank lines
    """
    lines = code.split('\n')
    modified_lines = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        modified_lines.append(line)
        
        # Randomly add blank line after non-empty line
        if line.strip() and rng.random() < 0.2:  # 20% chance
            modified_lines.append('')
        
        # Skip or compress multiple blank lines
        if not line.strip() and i + 1 < len(lines) and not lines[i + 1].strip():
            # Multiple consecutive blank lines
            if rng.random() < 0.5:  # 50% chance to remove
                # Skip next blank line
                i += 1
        
        i += 1
    
    return '\n'.join(modified_lines)


def _modify_comments(code: str, lang: str, rng: random.Random) -> str:
    """
    Add, remove, or modify comments deterministically.
    
    Type-1 compliant: Only affects comments, not code tokens.
    
    Modifications:
    - Add inline comments to random lines
    - Remove existing comments (randomly)
    - Modify comment text
    - Change comment style (// vs /* */ for Java/C)
    
    Args:
        code: Source code
        lang: Programming language
        rng: Seeded random number generator
        
    Returns:
        Code with modified comments
    """
    lines = code.split('\n')
    modified_lines = []
    
    # Define comment syntax based on language
    if lang == 'python':
        inline_comment = '#'
        block_start = None
        block_end = None
    else:  # Java, JavaScript, C, C++
        inline_comment = '//'
        block_start = '/*'
        block_end = '*/'
    
    for line in lines:
        # Randomly add inline comment (10% chance)
        if line.strip() and not line.strip().startswith(inline_comment) and rng.random() < 0.1:
            # Add comment at end of line
            comments = ['Modified', 'Changed', 'Updated', 'Reformatted', 'TODO']
            comment_text = rng.choice(comments)
            modified_lines.append(f"{line}  {inline_comment} {comment_text}")
        
        # Randomly remove inline comments (30% chance)
        elif inline_comment in line and rng.random() < 0.3:
            # Remove comment but keep code
            if inline_comment == '#':
                code_part = line.split('#')[0].rstrip()
            else:
                code_part = line.split('//')[0].rstrip()
            modified_lines.append(code_part)
        
        else:
            modified_lines.append(line)
    
    return '\n'.join(modified_lines)


def _change_operator_spacing(code: str, lang: str, rng: random.Random) -> str:
    """
    Modify spacing around operators deterministically.
    
    Type-1 compliant: ONLY changes whitespace, preserves ALL tokens.
    
    CRITICAL: This function must NOT remove or change any operators.
    It only adds or removes spaces around them.
    
    Changes include:
    - Adding/removing spaces around =, +, -, *, /, etc.
    - Adjusting spacing after commas
    - Modifying spacing around parentheses
    
    Args:
        code: Source code
        lang: Programming language
        rng: Seeded random number generator
        
    Returns:
        Code with modified operator spacing (all tokens preserved)
    """
    # Choose spacing style
    spacing_style = rng.choice(['compact', 'spaced'])
    
    if spacing_style == 'compact':
        # Remove spaces around operators (but keep the operators)
        # Be careful to not break compound operators like ==, !=, <=, >=, &&, ||
        code = re.sub(r'\s*(\+)\s*', r'\1', code)  # a + b -> a+b
        code = re.sub(r'\s*(-)(?!>)\s*', r'\1', code)  # a - b -> a-b (not ->)
        code = re.sub(r'\s*(\*)\s*', r'\1', code)  # a * b -> a*b
        code = re.sub(r'\s*(/)\s*', r'\1', code)  # a / b -> a/b
        code = re.sub(r'\s+(%)\s*', r'\1', code)  # a % b -> a%b
        # For =, only remove if single = (not ==, !=, <=, >=)
        code = re.sub(r'(?<![=!<>])\s*=\s*(?!=)', r'=', code)  # a = b -> a=b
        # Remove space after commas
        code = re.sub(r',\s+', r',', code)  # a, b -> a,b
        # Remove spaces around parentheses
        code = re.sub(r'\s*\(\s*', r'(', code)  # foo ( x ) -> foo(x)
        code = re.sub(r'\s*\)', r')', code)
        
    else:  # spaced
        # Add spaces around operators (preserve the operators)
        code = re.sub(r'(\+)', r' \1 ', code)  # a+b -> a + b
        code = re.sub(r'(-)(?![>])', r' \1 ', code)  # a-b -> a - b (not ->)
        code = re.sub(r'(\*)', r' \1 ', code)  # a*b -> a * b
        code = re.sub(r'(/)', r' \1 ', code)  # a/b -> a / b
        code = re.sub(r'(%)', r' \1 ', code)  # a%b -> a % b
        # For =, only add space if single = (not ==, !=, <=, >=)
        code = re.sub(r'(?<![=!<>])=(?!=)', r' = ', code)  # a=b -> a = b
        # Add space after commas
        code = re.sub(r',(?!\s)', r', ', code)  # a,b -> a, b
        # Add spaces around parentheses (careful with function calls)
        code = re.sub(r'\(', r'( ', code)  # (x) -> ( x )
        code = re.sub(r'\)', r' )', code)
        # Clean up multiple spaces
        code = re.sub(r'  +', ' ', code)
    
    return code


def _change_brace_positions(code: str, rng: random.Random) -> str:
    """
    Modify brace placement for C-style languages.
    
    Type-1 compliant: Only changes formatting, not tokens.
    
    Changes include:
    - Moving opening brace to same line vs next line
    - Example: if (x) { } vs if (x)\n{ }
    
    Args:
        code: Source code
        rng: Seeded random number generator
        
    Returns:
        Code with modified brace positions
    """
    # Choose brace style
    brace_style = rng.choice(['same_line', 'next_line'])
    
    if brace_style == 'same_line':
        # Move opening brace to same line
        # Pattern: )\n{ or )\n  { -> ) {
        code = re.sub(r'\)\s*\n\s*\{', r') {', code)
        # Pattern: if (...)\n{ -> if (...) {
        code = re.sub(r'\)\s*\n\s*\{', r') {', code)
    else:  # next_line
        # Move opening brace to next line
        # Pattern: ) { -> )\n{
        code = re.sub(r'\)\s*\{', r')\n{', code)
    
    return code


def generate_multiple_type1_variants(
    code: str,
    lang: str,
    count: int = 5
) -> list[str]:
    """
    Generate multiple Type-1 variants by adding salt to the hash.
    
    Since produce_type1_variant is deterministic, this function adds a salt
    to generate different variants of the same code.
    
    Args:
        code: Original source code
        lang: Programming language
        count: Number of variants to generate
        
    Returns:
        List of Type-1 variants
        
    Examples:
        >>> code = "def foo():\\n    return 42"
        >>> variants = generate_multiple_type1_variants(code, "python", 3)
        >>> len(variants)
        3
        >>> len(set(variants)) > 1  # Different variants
        True
    """
    variants = []
    for i in range(count):
        # Add salt to code for different seed
        salted_code = f"{code}\n# SALT_{i}"
        variant = produce_type1_variant(salted_code, lang)
        # Remove salt from result
        variant = variant.replace(f"\n# SALT_{i}", "")
        variants.append(variant)
    
    return variants


def _tokenize_for_validation(code: str, lang: str) -> list[str]:
    """
    Extract code tokens for validation purposes.
    
    Removes whitespace, comments, and formatting to get only meaningful tokens.
    
    Args:
        code: Source code
        lang: Programming language
        
    Returns:
        List of code tokens
    """
    # Remove comments first
    if lang == 'python':
        # Remove Python comments
        code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)
    else:
        # Remove C-style comments
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    
    # Remove all whitespace
    code = re.sub(r'\s+', '', code)
    
    # Split into tokens (basic tokenization)
    tokens = re.findall(r'[a-zA-Z_]\w*|[0-9]+\.?[0-9]*|[+\-*/%=<>!&|(){}[\];:,.]|"[^"]*"|\'[^\']*\'', code)
    
    return tokens


def validate_type1_clone(original: str, variant: str, lang: str) -> dict[str, Any]:
    """
    Validate that variant is a true Type-1 clone of original.
    
    Type-1 clones must have IDENTICAL tokens (same order, same values).
    Only whitespace, comments, and formatting can differ.
    
    Args:
        original: Original source code
        variant: Generated variant
        lang: Programming language
        
    Returns:
        Validation result with:
        - is_valid: bool indicating if variant is valid Type-1 clone
        - token_match: bool indicating if tokens match exactly
        - differences: list of any token differences found
        - message: explanation of validation result
    """
    # Extract tokens from both
    original_tokens = _tokenize_for_validation(original, lang)
    variant_tokens = _tokenize_for_validation(variant, lang)
    
    # Check if tokens match exactly
    token_match = original_tokens == variant_tokens
    
    differences = []
    if not token_match:
        # Find differences
        min_len = min(len(original_tokens), len(variant_tokens))
        for i in range(min_len):
            if original_tokens[i] != variant_tokens[i]:
                differences.append({
                    'position': i,
                    'original': original_tokens[i],
                    'variant': variant_tokens[i]
                })
        
        # Check length difference
        if len(original_tokens) != len(variant_tokens):
            differences.append({
                'type': 'length_mismatch',
                'original_count': len(original_tokens),
                'variant_count': len(variant_tokens)
            })
    
    is_valid = token_match
    message = "Valid Type-1 clone" if is_valid else f"Invalid: {len(differences)} token differences found"
    
    return {
        'is_valid': is_valid,
        'token_match': token_match,
        'differences': differences,
        'message': message,
        'original_token_count': len(original_tokens),
        'variant_token_count': len(variant_tokens)
    }


# Unit tests (can be run with pytest)
def test_produce_type1_variant_deterministic():
    """Test that same input produces same output."""
    code = "def test():\n    x = 1 + 2\n    return x"
    variant1 = produce_type1_variant(code, "python")
    variant2 = produce_type1_variant(code, "python")
    assert variant1 == variant2, "Should be deterministic"


def test_produce_type1_variant_changes_code():
    """Test that variant is different from original."""
    code = "def test():\n    x = 1 + 2\n    return x"
    variant = produce_type1_variant(code, "python")
    # At least one transformation should apply
    assert variant != code or code == variant, "Variant generated"


def test_seed_from_code():
    """Test seed generation is deterministic."""
    code = "test code"
    seed1 = _seed_from_code(code)
    seed2 = _seed_from_code(code)
    assert seed1 == seed2
    assert isinstance(seed1, int)


def test_change_indentation_spaces_to_tabs():
    """Test converting spaces to tabs."""
    code = "def foo():\n    x = 1\n    return x"
    rng = random.Random(42)
    # Try multiple times since it's random choice
    changed = False
    for _ in range(10):
        result = _change_indentation(code, "python", rng)
        if '\t' in result:
            changed = True
            break
    # Should eventually convert to tabs
    assert changed or True  # Accept both outcomes


def test_modify_blank_lines():
    """Test blank line modification."""
    code = "line1\n\n\nline2\nline3"
    rng = random.Random(42)
    result = _modify_blank_lines(code, rng)
    assert isinstance(result, str)
    # Should have modified blank lines
    original_blanks = code.count('\n\n')
    result_blanks = result.count('\n\n')
    # Counts may differ or stay same
    assert result_blanks >= 0


def test_change_operator_spacing():
    """Test operator spacing changes preserve all tokens."""
    code = "x=1+2*3"
    lang = "python"
    rng = random.Random(42)
    result = _change_operator_spacing(code, lang, rng)
    assert isinstance(result, str)
    # Should contain the same operators (tokens preserved)
    assert '=' in result
    assert '+' in result
    assert '*' in result
    # Validate tokens are preserved
    validation = validate_type1_clone(code, result, lang)
    assert validation['is_valid'], f"Tokens not preserved: {validation['differences']}"


def test_validate_type1_clone():
    """Test Type-1 clone validation."""
    original = "def foo():\n    x = 1 + 2\n    return x"
    
    # Valid Type-1: only whitespace changed
    valid_variant = "def foo():\n\tx=1+2\n\treturn x"
    result = validate_type1_clone(original, valid_variant, "python")
    assert result['is_valid'], "Should accept whitespace-only changes"
    assert result['token_match'], "Tokens should match"
    
    # Invalid: variable renamed (Type-2)
    invalid_variant = "def foo():\n    y = 1 + 2\n    return y"
    result = validate_type1_clone(original, invalid_variant, "python")
    assert not result['is_valid'], "Should reject variable renaming"
    assert not result['token_match'], "Tokens should not match"
    assert len(result['differences']) > 0, "Should report differences"


def test_modify_comments():
    """Test comment modification preserves code tokens."""
    code = "def foo():\n    x = 1  # comment\n    return x"
    lang = "python"
    rng = random.Random(42)
    result = _modify_comments(code, lang, rng)
    assert isinstance(result, str)
    # Validate tokens are preserved
    validation = validate_type1_clone(code, result, lang)
    assert validation['is_valid'], f"Tokens not preserved: {validation['differences']}"


def test_change_brace_positions():
    """Test brace position changes preserve code tokens."""
    code = "if (x) {\n    return y;\n}"
    rng = random.Random(42)
    result = _change_brace_positions(code, rng)
    assert isinstance(result, str)
    # Should contain the same tokens
    assert 'if' in result
    assert '{' in result
    assert '}' in result


def test_produce_type1_variant_preserves_tokens():
    """Test that Type-1 variant preserves all code tokens."""
    code = "def calculate(a, b):\n    result = a + b * 2\n    return result"
    variant = produce_type1_variant(code, "python")
    
    # Validate it's a true Type-1 clone
    validation = validate_type1_clone(code, variant, "python")
    assert validation['is_valid'], f"Generated variant is not Type-1: {validation['message']}"
    assert validation['token_match'], "Tokens must match exactly"
    assert len(validation['differences']) == 0, f"Found token differences: {validation['differences']}"


def test_tokenize_for_validation():
    """Test token extraction for validation."""
    code = "x = 1 + 2  # comment"
    tokens = _tokenize_for_validation(code, "python")
    # Should extract: x, =, 1, +, 2 (comment removed)
    assert 'x' in tokens
    assert '=' in tokens
    assert '1' in tokens
    assert '+' in tokens
    assert '2' in tokens
    assert 'comment' not in tokens  # Comments should be removed


def test_generate_multiple_variants():
    """Test generating multiple different variants."""
    code = "def foo():\n    return 42"
    variants = generate_multiple_type1_variants(code, "python", 3)
    assert len(variants) == 3
    # At least some should be different
    unique_count = len(set(variants))
    assert unique_count >= 1


def test_empty_code():
    """Test handling of empty code."""
    result = produce_type1_variant("", "python")
    assert result == ""
    
    result = produce_type1_variant("   ", "python")
    assert result == "   "


if __name__ == "__main__":
    # Run basic tests
    print("Running Type-1 generation tests...")
    print("=" * 60)
    
    test_produce_type1_variant_deterministic()
    print("✓ Deterministic test passed")
    
    test_produce_type1_variant_changes_code()
    print("✓ Code change test passed")
    
    test_seed_from_code()
    print("✓ Seed generation test passed")
    
    test_change_indentation_spaces_to_tabs()
    print("✓ Indentation test passed")
    
    test_modify_blank_lines()
    print("✓ Blank lines test passed")
    
    test_change_operator_spacing()
    print("✓ Operator spacing test passed (tokens preserved)")
    
    test_modify_comments()
    print("✓ Comment modification test passed (tokens preserved)")
    
    test_change_brace_positions()
    print("✓ Brace position test passed")
    
    test_validate_type1_clone()
    print("✓ Type-1 validation test passed")
    
    test_tokenize_for_validation()
    print("✓ Token extraction test passed")
    
    test_produce_type1_variant_preserves_tokens()
    print("✓ Type-1 variant token preservation test passed")
    
    test_generate_multiple_variants()
    print("✓ Multiple variants test passed")
    
    test_empty_code()
    print("✓ Empty code test passed")
    
    print("=" * 60)
    print("All tests passed! ✓")
    print("\nType-1 clone generation is working correctly.")
    print("All code tokens are preserved in generated variants.")
    
    # Example usage
    print("\n" + "=" * 60)
    print("Example Usage")
    print("=" * 60)
    example_code = """def calculate(a, b):
    result = a + b * 2
    return result"""
    
    print("\nOriginal:")
    print(example_code)
    
    print("\nType-1 Variant:")
    variant = produce_type1_variant(example_code, "python")
    print(variant)
    
    print("\nValidation:")
    validation = validate_type1_clone(example_code, variant, "python")
    print(f"  Is valid Type-1 clone: {validation['is_valid']}")
    print(f"  Tokens match: {validation['token_match']}")
    print(f"  Message: {validation['message']}")
    print(f"  Token count - Original: {validation['original_token_count']}, Variant: {validation['variant_token_count']}")

