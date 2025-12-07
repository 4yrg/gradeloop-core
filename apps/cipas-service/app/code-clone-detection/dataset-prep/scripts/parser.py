"""
PolyglotParser for parsing code in multiple programming languages using Tree-sitter.

This module provides a unified interface for parsing code across multiple
programming languages using Tree-sitter, with language-specific identifier
extraction capabilities.
"""

import importlib
from typing import Dict, List
from tree_sitter import Language, Parser, Node, Tree


class PolyglotParser:
    """
    A parser that dynamically loads Tree-sitter language modules and provides
    language-specific parsing capabilities for code clone detection.

    Features:
    - Dynamic language loading with caching
    - Support for 20+ programming languages
    - Language name normalization (e.g., c_sharp -> c-sharp)
    - Language-specific identifier extraction
    """

    # Language name mappings for Tree-sitter modules
    LANGUAGE_MAPPINGS = {
        'c_sharp': 'c-sharp',
        'csharp': 'c-sharp',
        'c#': 'c-sharp',
        'cpp': 'cpp',
        'c++': 'cpp',
        'c': 'c',
        'java': 'java',
        'python': 'python',
        'javascript': 'javascript',
        'js': 'javascript',
        'typescript': 'typescript',
        'ts': 'typescript',
        'go': 'go',
        'rust': 'rust',
        'ruby': 'ruby',
        'php': 'php',
        'kotlin': 'kotlin',
        'swift': 'swift',
        'scala': 'scala',
        'r': 'r',
        'matlab': 'matlab',
        'sql': 'sql',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'toml': 'toml'
    }

    # Language-specific node type mappings for identifier extraction
    IDENTIFIER_NODE_MAPPINGS = {
        'c': ['identifier', 'field_identifier', 'type_identifier', 'primitive_type'],
        'cpp': ['identifier', 'field_identifier', 'type_identifier', 'namespace_identifier', 'primitive_type'],
        'c-sharp': ['identifier', 'type_identifier', 'namespace_identifier', 'generic_name', 'predefined_type'],
        'java': ['identifier', 'type_identifier', 'field_identifier', 'method_identifier'],
        'python': ['identifier', 'attribute', 'global_identifier', 'nonlocal_identifier'],
        'javascript': ['identifier', 'property_identifier', 'shorthand_property_identifier'],
        'typescript': ['identifier', 'property_identifier', 'shorthand_property_identifier', 'type_identifier'],
        'go': ['identifier', 'field_identifier', 'type_identifier', 'package_identifier'],
        'rust': ['identifier', 'field_identifier', 'type_identifier', 'lifetime'],
        'ruby': ['identifier', 'constant', 'instance_variable', 'class_variable', 'global_variable'],
        'php': ['name', 'variable_name', 'property_name', 'namespace_name'],
        'kotlin': ['simple_identifier', 'identifier'],
        'swift': ['simple_identifier', 'identifier'],
        'scala': ['identifier', 'operator_identifier'],
        'r': ['identifier'],
        'matlab': ['identifier'],
        'sql': ['identifier']
    }

    def __init__(self):
        """Initialize the parser with empty caches."""
        self._loaded_languages: Dict[str, Language] = {}
        self._parsers: Dict[str, Parser] = {}

    def _normalize_language_name(self, lang: str) -> str:
        """
        Normalize language name to Tree-sitter module name.

        Args:
            lang: Language name (e.g., 'c_sharp', 'C#', 'python')

        Returns:
            Normalized language name for Tree-sitter module
        """
        lang_lower = lang.lower().strip()
        return self.LANGUAGE_MAPPINGS.get(lang_lower, lang_lower)

    def _load_language(self, lang: str) -> Language:
        """
        Dynamically load Tree-sitter language module.

        Args:
            lang: Normalized language name

        Returns:
            Tree-sitter Language instance

        Raises:
            ImportError: If the language module cannot be imported
        """
        if lang in self._loaded_languages:
            return self._loaded_languages[lang]

        try:
            module_name = f"tree_sitter_{lang.replace('-', '_')}"
            module = importlib.import_module(module_name)

            if hasattr(module, 'language'):
                language_func = getattr(module, 'language')
                language = Language(language_func())
            else:
                raise AttributeError(f"Module {module_name} does not have 'language' function")

            self._loaded_languages[lang] = language
            return language

        except ImportError as e:
            raise ImportError(
                f"Could not import Tree-sitter language module for '{lang}'. "
                f"Please install: pip install tree-sitter-{lang}"
            ) from e

    def _get_parser(self, lang: str) -> Parser:
        """
        Get or create a parser for the given language.

        Args:
            lang: Normalized language name

        Returns:
            Tree-sitter Parser instance configured for the language
        """
        if lang not in self._parsers:
            language = self._load_language(lang)
            parser = Parser(language)
            self._parsers[lang] = parser

        return self._parsers[lang]

    def parse(self, code: str, lang: str) -> Tree:
        """
        Parse code using Tree-sitter for the specified language.

        Args:
            code: Source code to parse
            lang: Programming language name

        Returns:
            Tree-sitter Tree object

        Raises:
            ImportError: If the language module cannot be loaded
            ValueError: If the code cannot be parsed
        """
        normalized_lang = self._normalize_language_name(lang)
        parser = self._get_parser(normalized_lang)

        try:
            code_bytes = code.encode('utf-8')
            tree = parser.parse(code_bytes)

            if tree.root_node is None:
                raise ValueError(f"Failed to parse code for language '{lang}'")

            return tree

        except Exception as e:
            raise ValueError(f"Error parsing code for language '{lang}': {str(e)}") from e

    @staticmethod
    def get_identifier_nodes(tree: Tree, lang: str) -> List[Node]:
        """
        Extract identifier nodes from a Tree-sitter parse tree.

        Args:
            tree: Tree-sitter Tree object
            lang: Programming language name

        Returns:
            List of Tree-sitter Node objects representing identifiers
        """
        parser_instance = PolyglotParser()
        normalized_lang = parser_instance._normalize_language_name(lang)
        identifier_types = PolyglotParser.IDENTIFIER_NODE_MAPPINGS.get(
            normalized_lang, ['identifier']
        )

        identifier_nodes = []

        def traverse(node: Node):
            if node.type in identifier_types:
                identifier_nodes.append(node)
            for child in node.children:
                traverse(child)

        traverse(tree.root_node)
        return identifier_nodes

    def get_supported_languages(self) -> List[str]:
        """Get list of supported language names."""
        return list(self.LANGUAGE_MAPPINGS.keys())

    def is_language_supported(self, lang: str) -> bool:
        """Check if a language is supported."""
        normalized_lang = self._normalize_language_name(lang)
        return normalized_lang in self.LANGUAGE_MAPPINGS.values()

