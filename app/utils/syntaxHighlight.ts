// app/utils/syntaxHighlight.ts
// INCO CODE 

import React from 'react';
import { Text } from 'react-native';
import { Colors, Typography } from '../themes';
import type { LanguageType } from '../storage';

// ===========================
// TYPES
// ===========================

interface Token {
  type: string;
  value: string;
}

type TokenRule = {
  type: string;
  regex: RegExp;
};

// ===========================
// RÈGLES PAR LANGAGE
// ===========================

const HTML_RULES: TokenRule[] = [
  { type: 'comment',   regex: /<!--[\s\S]*?-->/g },
  { type: 'doctype',   regex: /<!DOCTYPE[^>]*>/gi },
  { type: 'tag',       regex: /<\/[\w-]+>/g },
  { type: 'tag',       regex: /<[\w-]+/g },
  { type: 'tag',       regex: /\/?>/g },
  { type: 'attribute', regex: /[\w-]+=(?="[^"]*"|'[^']*')/g },
  { type: 'string',    regex: /"[^"]*"|'[^']*'/g },
  { type: 'text',      regex: /[^<>"'=\s]+/g },
];

const CSS_RULES: TokenRule[] = [
  { type: 'comment',   regex: /\/\*[\s\S]*?\*\//g },
  { type: 'string',    regex: /"[^"]*"|'[^']*'/g },
  { type: 'property',  regex: /[\w-]+(?=\s*:)/g },
  { type: 'number',    regex: /-?\d+(\.\d+)?(px|em|rem|%|vh|vw|deg|s|ms)?/g },
  { type: 'tag',       regex: /#[0-9a-fA-F]{3,8}/g },
  { type: 'keyword',   regex: /[@:][a-zA-Z-]+/g },
  { type: 'punctuation', regex: /[{}();:,]/g },
];

const JS_KEYWORDS = [
  'const', 'let', 'var', 'function', 'class', 'return', 'if', 'else',
  'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new',
  'delete', 'typeof', 'instanceof', 'in', 'of', 'import', 'export',
  'default', 'from', 'async', 'await', 'try', 'catch', 'finally',
  'throw', 'null', 'undefined', 'true', 'false', 'this', 'super',
  'extends', 'static', 'get', 'set', 'yield',
];

const JS_RULES: TokenRule[] = [
  { type: 'comment',   regex: /\/\/[^\n]*/g },
  { type: 'comment',   regex: /\/\*[\s\S]*?\*\//g },
  { type: 'string',    regex: /`[^`]*`/g },
  { type: 'string',    regex: /"[^"]*"|'[^']*'/g },
  { type: 'keyword',   regex: new RegExp(`\\b(${JS_KEYWORDS.join('|')})\\b`, 'g') },
  { type: 'function',  regex: /\b[\w$]+(?=\s*\()/g },
  { type: 'number',    regex: /\b\d+(\.\d+)?\b/g },
  { type: 'constant',  regex: /\b[A-Z_][A-Z0-9_]{2,}\b/g },
  { type: 'operator',  regex: /[+\-*/%=<>!&|^~?:]+/g },
  { type: 'punctuation', regex: /[{}[\]();,.]/g },
];

const TS_KEYWORDS = [...JS_KEYWORDS, 'interface', 'type', 'enum', 'namespace', 'declare', 'abstract', 'implements', 'as', 'readonly', 'private', 'public', 'protected', 'never', 'void', 'any', 'string', 'number', 'boolean', 'object', 'unknown'];

const TS_RULES: TokenRule[] = [
  { type: 'comment',   regex: /\/\/[^\n]*/g },
  { type: 'comment',   regex: /\/\*[\s\S]*?\*\//g },
  { type: 'string',    regex: /`[^`]*`/g },
  { type: 'string',    regex: /"[^"]*"|'[^']*'/g },
  { type: 'keyword',   regex: new RegExp(`\\b(${TS_KEYWORDS.join('|')})\\b`, 'g') },
  { type: 'type',      regex: /\b[A-Z][a-zA-Z0-9]*\b/g },
  { type: 'function',  regex: /\b[\w$]+(?=\s*[<(])/g },
  { type: 'number',    regex: /\b\d+(\.\d+)?\b/g },
  { type: 'operator',  regex: /[+\-*/%=<>!&|^~?:]+/g },
  { type: 'punctuation', regex: /[{}[\]();,.]/g },
];

const PYTHON_KEYWORDS = [
  'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while',
  'import', 'from', 'as', 'with', 'try', 'except', 'finally', 'raise',
  'in', 'not', 'and', 'or', 'is', 'lambda', 'pass', 'break', 'continue',
  'del', 'global', 'nonlocal', 'yield', 'True', 'False', 'None', 'async', 'await',
];

const PYTHON_RULES: TokenRule[] = [
  { type: 'comment',   regex: /#[^\n]*/g },
  { type: 'string',    regex: /"""[\s\S]*?"""|'''[\s\S]*?'''/g },
  { type: 'string',    regex: /"[^"]*"|'[^']*'/g },
  { type: 'keyword',   regex: new RegExp(`\\b(${PYTHON_KEYWORDS.join('|')})\\b`, 'g') },
  { type: 'function',  regex: /\b[\w]+(?=\s*\()/g },
  { type: 'number',    regex: /\b\d+(\.\d+)?\b/g },
  { type: 'operator',  regex: /[+\-*/%=<>!&|^~?:]+/g },
  { type: 'punctuation', regex: /[{}[\]();,.]/g },
];

const JSON_RULES: TokenRule[] = [
  { type: 'string',   regex: /"(?:\\.|[^"\\])*"(?=\s*:)/g },  // keys
  { type: 'property', regex: /"(?:\\.|[^"\\])*"(?!\s*:)/g },  // values string
  { type: 'number',   regex: /-?\d+(\.\d+)?([eE][+-]?\d+)?/g },
  { type: 'keyword',  regex: /\b(true|false|null)\b/g },
  { type: 'punctuation', regex: /[{}[\]:,]/g },
];

const MD_RULES: TokenRule[] = [
  { type: 'keyword',  regex: /^#{1,6}\s.+/gm },         // headers
  { type: 'string',   regex: /`[^`]+`/g },               // inline code
  { type: 'comment',  regex: /```[\s\S]*?```/g },        // code blocks
  { type: 'tag',      regex: /\[([^\]]+)\]\([^)]+\)/g }, // links
  { type: 'operator', regex: /(\*\*|__).+?\1/g },        // bold
  { type: 'property', regex: /(\*|_).+?\1/g },           // italic
  { type: 'variable', regex: /^[-*+]\s/gm },             // list items
];

const RULES_MAP: Record<LanguageType, TokenRule[]> = {
  html:       HTML_RULES,
  css:        CSS_RULES,
  javascript: JS_RULES,
  typescript: TS_RULES,
  json:       JSON_RULES,
  markdown:   MD_RULES,
  python:     PYTHON_RULES,
  txt:        [],
};

// ===========================
// COULEURS DES TOKENS
// ===========================

const TOKEN_COLORS: Record<string, string> = {
  comment:    Colors.syntax.comment,
  doctype:    Colors.syntax.comment,
  string:     Colors.syntax.string,
  keyword:    Colors.syntax.keyword,
  tag:        Colors.syntax.tag,
  attribute:  Colors.syntax.attribute,
  property:   Colors.syntax.property,
  number:     Colors.syntax.number,
  operator:   Colors.syntax.operator,
  punctuation:Colors.syntax.punctuation,
  function:   Colors.syntax.function,
  type:       Colors.syntax.type,
  constant:   Colors.syntax.constant,
  variable:   Colors.syntax.variable,
  text:       Colors.text.primary,
};

// ===========================
// TOKENIZER
// ===========================

/**
 * Tokenize une ligne de code selon le langage
 */
function tokenizeLine(line: string, language: LanguageType): Token[] {
  const rules = RULES_MAP[language];
  if (!rules || rules.length === 0) {
    return [{ type: 'text', value: line }];
  }

  // Tableau de positions couvertes
  const covered: boolean[] = new Array(line.length).fill(false);
  const tokens: { start: number; end: number; type: string; value: string }[] = [];

  // Appliquer chaque règle
  for (const rule of rules) {
    rule.regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = rule.regex.exec(line)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      // Vérifier qu'on ne recouvre pas déjà quelque chose
      let alreadyCovered = false;
      for (let i = start; i < end; i++) {
        if (covered[i]) { alreadyCovered = true; break; }
      }
      if (alreadyCovered) continue;

      for (let i = start; i < end; i++) covered[i] = true;
      tokens.push({ start, end, type: rule.type, value: match[0] });
    }
  }

  // Ajouter les parties non couvertes comme texte plain
  let lastEnd = 0;
  const sorted = tokens.sort((a, b) => a.start - b.start);
  const result: Token[] = [];

  for (const tok of sorted) {
    if (tok.start > lastEnd) {
      const plain = line.slice(lastEnd, tok.start);
      if (plain) result.push({ type: 'text', value: plain });
    }
    result.push({ type: tok.type, value: tok.value });
    lastEnd = tok.end;
  }

  if (lastEnd < line.length) {
    result.push({ type: 'text', value: line.slice(lastEnd) });
  }

  return result;
}

// ===========================
// RENDERER REACT NATIVE
// ===========================

interface RenderOptions {
  fontSize: number;
  showLineNumbers: boolean;
  startLine?: number;
}

/**
 * Rend du code colorisé en composants React Native Text
 * Retourne un tableau de <Text> (une ligne = un élément)
 */
export const renderHighlightedCode = (
  code: string,
  language: LanguageType,
  options: RenderOptions,
): React.ReactElement[] => {
  const { fontSize, showLineNumbers, startLine = 1 } = options;
  const lines = code.split('\n');

  return lines.map((line, lineIndex) => {
    const lineNum = startLine + lineIndex;
    const tokens = tokenizeLine(line, language);

    const tokenElements = tokens.map((token, i) => (
      React.createElement(Text, {
        key: i,
        style: {
          color: TOKEN_COLORS[token.type] || Colors.text.primary,
          fontFamily: 'Courier New',
          fontSize,
        },
      }, token.value)
    ));

    // Ajouter une espace pour les lignes vides (sinon elles disparaissent)
    if (tokenElements.length === 0) {
      tokenElements.push(
        React.createElement(Text, {
          key: 'empty',
          style: { fontSize },
        }, ' ')
      );
    }

    return React.createElement(
      Text,
      {
        key: lineIndex,
        style: {
          flexDirection: 'row',
          minHeight: fontSize * 1.6,
        },
      },
      // Numéro de ligne
      showLineNumbers && React.createElement(Text, {
        key: 'ln',
        style: {
          width: 40,
          color: Colors.text.muted,
          fontFamily: 'Courier New',
          fontSize: fontSize - 1,
          textAlign: 'right',
          paddingRight: 12,
          userSelect: 'none' as any,
        },
      }, String(lineNum)),
      // Tokens colorisés
      ...tokenElements,
    );
  });
};

/**
 * Version simple: retourne du texte avec couleurs pour ScrollView
 * (plus performant pour les grands fichiers)
 */
export const getTokenizedLines = (
  code: string,
  language: LanguageType,
): { lineNum: number; tokens: Token[] }[] => {
  return code.split('\n').map((line, i) => ({
    lineNum: i + 1,
    tokens: tokenizeLine(line, language),
  }));
};

/**
 * Couleur d'un type de token
 */
export const getTokenColor = (type: string): string => {
  return TOKEN_COLORS[type] || Colors.text.primary;
};

/**
 * Icône selon le langage (pour les onglets)
 */
export const getLanguageIcon = (language: LanguageType): string => {
  const icons: Record<LanguageType, string> = {
    html:       '🌐',
    css:        '🎨',
    javascript: '⚡',
    typescript: '🔷',
    json:       '📦',
    markdown:   '📝',
    python:     '🐍',
    txt:        '📄',
  };
  return icons[language] || '📄';
};

/**
 * Couleur d'accent selon le langage
 */
export const getLanguageColor = (language: LanguageType): string => {
  const colors: Record<LanguageType, string> = {
    html:       '#FF7B54',
    css:        '#58A6FF',
    javascript: '#F1C40F',
    typescript: '#3498DB',
    json:       '#3FB950',
    markdown:   '#8B949E',
    python:     '#3498DB',
    txt:        '#8B949E',
  };
  return colors[language] || Colors.text.secondary;
};
