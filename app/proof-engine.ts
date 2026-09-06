// Copyright 2026 Adam Petcher (to the extent copyright subsists)
// SPDX-License-Identifier: Apache-2.0

import { unlockedMoves, type HeroClass, type MoveId } from "./curriculum.ts";
import { tacticManaCost } from "./game-balance.ts";
import {
  collectCandidateTerms,
  projectionCandidateProvider,
  type CandidateTerm,
  type ProjectionCandidate,
} from "./candidate-providers.ts";

type UnlockedMoves = ReadonlySet<MoveId>;

function hasMove(unlocks: UnlockedMoves, move: MoveId) {
  return unlocks.has(move);
}

export type EnvironmentEntry = { name: string; type: string };

export type ProofNode =
  | { kind: "hole"; id: number; expected: string; environment: EnvironmentEntry[]; allowedTexts?: string[]; applicationArgumentId?: number; applicationTarget?: string; termPlaceholder?: string }
  | { kind: "term"; text: string; type: string; termPlaceholder?: string }
  | { kind: "template"; type: string; format: string; children: ProofNode[]; precedence?: "lambda" | "application"; termPlaceholder?: string; tacticBranches?: boolean };

type Pending =
  | { kind: "dot-source"; holeId: number; target: string }
  | { kind: "dot-function"; holeId: number; target: string; source: TermCandidate }
  | { kind: "apply"; holeId: number; target: string }
  | { kind: "exact"; holeId: number }
  | { kind: "witness"; holeId: number; witnessType: string; binder: string; body: string }
  | { kind: "tactic-argument"; holeId: number; key: string; argumentTypes: string[] };

type TypeConstraint = { left: string; right: string; environment: EnvironmentEntry[] };

type TacticScriptLayout = {
  kind: "calc";
  left: string;
  middle: string;
  right: string;
};

export type ProofState = {
  theorem: string;
  root: ProofNode;
  nextId: number;
  nextMetaId: number;
  substitutions: Record<number, string>;
  termSubstitutions: Record<string, string>;
  metaTypes: Record<number, string>;
  constraints: TypeConstraint[];
  moves: string[];
  tacticScript: string[];
  tacticBranchPaths: number[][];
  tacticScriptLayouts: (TacticScriptLayout | null)[];
  pending?: Pending;
};

export type ProofDisplayPart = {
  text: string;
  hole?: boolean;
  active?: boolean;
};

export type MoveChoice = {
  id: string;
  label: string;
  category: "term" | "tactic" | "argument";
  manaCost: number;
  input?: "natural-number";
  argumentType?: string;
  scriptReplacement?: string;
  scriptLayout?: TacticScriptLayout;
  acceptsInput?: (value: string) => boolean;
  apply: (value?: string) => ProofState;
};

type TacticArgumentSpec = {
  key: string;
  placeholderLabel: string;
  term: string;
  type: string;
  scriptArgument?: string;
};

type CatalogueMoveChoice = Omit<MoveChoice, "manaCost"> & {
  tacticArgument?: TacticArgumentSpec;
};

type FunctionShape = {
  binder?: string;
  implicit?: boolean;
  domain: string;
  codomain: string;
};

type TermCandidate = CandidateTerm;

export const libraryTermTypes = {
  "True.intro": "True",
  "And.intro": "∀ {a b : Prop}, a → b → a ∧ b",
  "And.left": "∀ {a b : Prop}, a ∧ b → a",
  "And.right": "∀ {a b : Prop}, a ∧ b → b",
  "Or.inl": "∀ {a b : Prop}, a → a ∨ b",
  "Or.inr": "∀ {a b : Prop}, b → a ∨ b",
  "Or.elim": "∀ {a b c : Prop}, a ∨ b → (a → c) → (b → c) → c",
  "False.elim": "∀ {C : Sort u}, False → C",
  "Iff.intro": "∀ {a b : Prop}, (a → b) → (b → a) → (a ↔ b)",
  "Iff.mp": "∀ {a b : Prop}, (a ↔ b) → a → b",
  "Iff.mpr": "∀ {a b : Prop}, (a ↔ b) → b → a",
  "Classical.byContradiction": "∀ {p : Prop}, (¬p → False) → p",
  "Eq.refl": "∀ {α : Sort u}, ∀ a : α, a = a",
  "Exists.intro": "∀ {α : Sort u}, ∀ {p : α → Prop}, ∀ w : α, p w → ∃ x : α, p x",
  "Exists.elim": "∀ {α : Sort u}, ∀ {p : α → Prop}, ∀ {b : Prop}, " +
    "(∃ x : α, p x) → (∀ a : α, p a → b) → b",
  "Eq.symm": "∀ {α : Sort u}, ∀ {a b : α}, a = b → b = a",
  "Eq.trans": "∀ {α : Sort u}, ∀ {a b c : α}, a = b → b = c → a = c",
  "congrArg": "∀ {α : Sort u}, ∀ {β : Sort v}, ∀ {a1 a2 : α}, " +
    "∀ f : α → β, a1 = a2 → f a1 = f a2",
  "Eq.mp": "∀ {α β : Sort u}, α = β → α → β",
  "Classical.em": "∀ p : Prop, p ∨ ¬p",
  "Nat.rec": "∀ {motive : Nat → Sort u}, motive 0 → " +
    "(∀ n : Nat, motive n → motive (Nat.succ n)) → ∀ value : Nat, motive value",
  "List.rec": "∀ {α : Type u}, ∀ {motive : List α → Sort v}, motive [] → " +
    "(∀ head : α, ∀ tail : List α, motive tail → motive (head :: tail)) → " +
    "∀ value : List α, motive value",
  "Nat.succ": "Nat → Nat",
  "List.cons": "∀ {α : Type u}, α → List α → List α",
  "Nat.add_succ": "∀ n m : Nat, n + Nat.succ m = Nat.succ (n + m)",
  "Nat.succ_add": "∀ n m : Nat, Nat.succ n + m = Nat.succ (n + m)",
  "Nat.add_comm": "∀ n m : Nat, n + m = m + n",
  "List.append_nil": "∀ {α : Type u}, ∀ as : List α, as ++ [] = as",
  "List.append_assoc": "∀ {α : Type u}, ∀ as bs cs : List α, " +
    "(as ++ bs) ++ cs = as ++ (bs ++ cs)",
  "List.length_append": "∀ {α : Type u}, ∀ {as bs : List α}, " +
    "(as ++ bs).length = as.length + bs.length",
  "sum": "List Nat → Nat",
  "sum_append": "∀ xs ys : List Nat, sum (xs ++ ys) = sum xs + sum (ys)",
  "Nat.add": "Nat → Nat → Nat",
  "Nat.zero_add": "∀ n : Nat, 0 + n = n",
  "Nat.add_assoc": "∀ a b c : Nat, (a + b) + c = a + (b + c)",
  "Nat.add_left_comm": "∀ a b c : Nat, a + (b + c) = b + (a + c)",
  "List.Perm.rec": "∀ {α : Type u}, ∀ {motive : ∀ xs ys : List α, List.Perm xs ys → Prop}, " +
    "motive [] [] (List.Perm.refl []) → " +
    "(∀ x : α, ∀ {l1 l2 : List α}, ∀ h : List.Perm l1 l2, " +
      "motive l1 l2 h → motive (x :: l1) (x :: l2) (List.Perm.cons x h)) → " +
    "(∀ x y : α, ∀ l : List α, motive (y :: x :: l) (x :: y :: l) (List.Perm.swap x y l)) → " +
    "(∀ {l1 l2 l3 : List α}, ∀ h1 : List.Perm l1 l2, ∀ h2 : List.Perm l2 l3, " +
      "motive l1 l2 h1 → motive l2 l3 h2 → motive l1 l3 (List.Perm.trans h1 h2)) → " +
    "∀ {xs ys : List α}, ∀ h : List.Perm xs ys, motive xs ys h",
  "List.replicate": "∀ {α : Type u}, Nat → α → List α",
  "Nat.mul": "Nat → Nat → Nat",
  "Nat.zero_mul": "∀ n : Nat, 0 * n = 0",
  "Nat.succ_mul": "∀ n x : Nat, Nat.succ n * x = n * x + x",
  "sum_replicate": "∀ n x : Nat, sum (List.replicate n x) = n * x",
  "repeatEach": "Nat → List Nat → List Nat",
  "Nat.mul_add": "∀ n a b : Nat, n * (a + b) = n * a + n * b",
} as const;

function balancedOuterParens(value: string) {
  const text = value.trim();
  if (!text.startsWith("(") || !text.endsWith(")")) return false;
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "(") depth += 1;
    if (text[index] === ")") depth -= 1;
    if (depth === 0 && index < text.length - 1) return false;
  }
  return depth === 0;
}

export function stripTypeParens(value: string) {
  let text = value.trim();
  while (balancedOuterParens(text)) text = text.slice(1, -1).trim();
  return text;
}

function topLevelIndex(value: string, operator: string) {
  let depth = 0;
  for (let index = 0; index <= value.length - operator.length; index += 1) {
    const character = value[index];
    if ("([{⟨".includes(character)) depth += 1;
    if (")]}>⟩".includes(character)) depth -= 1;
    if (depth !== 0 || value.slice(index, index + operator.length) !== operator) continue;
    if (operator === "+" && (value[index - 1] === "+" || value[index + 1] === "+")) continue;
    return index;
  }
  return -1;
}

function splitTop(value: string, operator: string): [string, string] | null {
  const text = stripTypeParens(value);
  const index = topLevelIndex(text, operator);
  return index < 0
    ? null
    : [text.slice(0, index).trim(), text.slice(index + operator.length).trim()];
}

function inferImplicitBinderType(body: string, environment: EnvironmentEntry[]) {
  if (/\bNat\b|\+/.test(body)) return "Nat";
  if (/\bList\b|\+\+/.test(body)) {
    const typeName = environment.find((entry) => entry.type === "Type")?.name ?? "α";
    return `List ${typeName}`;
  }
  return environment.filter((entry) => entry.type === "Type").length === 1
    ? environment.find((entry) => entry.type === "Type")!.name
    : "_";
}

type ParsedType =
  | { kind: "meta"; source: string; id: number }
  | { kind: "atom"; source: string }
  | { kind: "application"; source: string; fn: ParsedType; argument: ParsedType }
  | { kind: "lambda"; source: string; binder: string; body: ParsedType }
  | { kind: "negation"; source: string; body: ParsedType }
  | { kind: "arrow"; source: string; domain: ParsedType; codomain: ParsedType }
  | { kind: "forall"; source: string; binder: string; domain: ParsedType; body: ParsedType; implicit?: boolean }
  | { kind: "exists"; source: string; binder: string; domain: ParsedType; body: ParsedType; implicit?: boolean }
  | { kind: "and" | "or" | "iff" | "equality"; source: string; left: ParsedType; right: ParsedType };

function renderParsedType(node: ParsedType): string {
  if (node.kind === "meta" || node.kind === "atom") return node.source;
  if (node.kind === "application") {
    const fn = renderParsedType(node.fn);
    const argument = renderParsedType(node.argument);
    const fnText = ["lambda", "arrow", "forall", "exists"].includes(node.fn.kind) ? `(${fn})` : fn;
    const atomExpression = node.argument.kind === "atom" ? parseTermExpression(node.argument.source) : null;
    const simpleArgument = node.argument.kind === "meta" || node.argument.kind === "negation" ||
      (node.argument.kind === "atom" && (!atomExpression || atomExpression.kind === "atom"));
    const argumentText = simpleArgument ? argument : `(${argument})`;
    return `${fnText} ${argumentText}`;
  }
  if (node.kind === "lambda") return `fun ${node.binder} => ${renderParsedType(node.body)}`;
  if (node.kind === "negation") {
    const body = renderParsedType(node.body);
    return ["atom", "meta", "application", "negation"].includes(node.body.kind) ? `¬${body}` : `¬(${body})`;
  }
  if (node.kind === "arrow") {
    const domain = renderParsedType(node.domain);
    const codomain = renderParsedType(node.codomain);
    const domainText = ["arrow", "forall", "exists", "and", "or", "iff", "equality"].includes(node.domain.kind)
      ? `(${domain})`
      : domain;
    const codomainText = node.codomain.kind === "iff" ? `(${codomain})` : codomain;
    return `${domainText} → ${codomainText}`;
  }
  if (node.kind === "forall" || node.kind === "exists") {
    const quantifier = node.kind === "forall" ? "∀" : "∃";
    const binder = `${node.binder} : ${renderParsedType(node.domain)}`;
    return `${quantifier} ${node.implicit ? `{${binder}}` : binder}, ${renderParsedType(node.body)}`;
  }
  const operator = { and: "∧", or: "∨", iff: "↔", equality: "=" }[node.kind];
  const left = renderParsedType(node.left);
  const right = renderParsedType(node.right);
  const leftText = ["arrow", "forall", "exists"].includes(node.left.kind) ? `(${left})` : left;
  const rightText = ["arrow", "forall", "exists"].includes(node.right.kind) ? `(${right})` : right;
  return `${leftText} ${operator} ${rightText}`;
}

function splitTopLevelApplication(value: string) {
  const text = stripTypeParens(value);
  const termExpression = parseTermExpression(text);
  if (termExpression && ["add", "mul", "append", "cons"].includes(termExpression.kind)) return null;
  let depth = 0;
  for (let index = text.length - 1; index >= 0; index -= 1) {
    const character = text[index];
    if (")]}>⟩".includes(character)) depth += 1;
    if ("([{⟨".includes(character)) depth -= 1;
    if (depth === 0 && /\s/.test(character)) {
      const fn = text.slice(0, index).trim();
      const argument = text.slice(index + 1).trim();
      const fnEndsWithOperator = /(?:\+\+|::|[*+=→∧∨↔,])$/.test(fn);
      const argumentStartsWithOperator = /^(?:\+\+|::|[*+=→∧∨↔,])/.test(argument);
      if (fn && argument && !fnEndsWithOperator && !argumentStartsWithOperator) {
        return [fn, argument] as const;
      }
    }
  }
  return null;
}

const parsedTypeCache = new Map<string, ParsedType>();

function parseType(type: string, environment: EnvironmentEntry[]): ParsedType {
  const source = stripTypeParens(type);
  const environmentKey = environment.map((entry) => `${entry.name}:${entry.type}`).join("|");
  const key = `${environmentKey}\u0000${source}`;
  const cached = parsedTypeCache.get(key);
  if (cached) return cached;
  const parsed = parseTypeUncached(source, environment);
  parsedTypeCache.set(key, parsed);
  return parsed;
}

function parseTypeUncached(type: string, environment: EnvironmentEntry[]): ParsedType {
  const source = stripTypeParens(type);

  const meta = source.match(/^\?u(\d+)$/);
  if (meta) return { kind: "meta", source, id: Number(meta[1]) };

  if (source.startsWith("fun ")) {
    const arrow = topLevelIndex(source, "=>");
    if (arrow >= 0) {
      const binderText = source.slice(4, arrow).trim();
      const binder = binderText.split(/\s*:\s*/)[0].trim();
      return {
        kind: "lambda",
        source,
        binder,
        body: parseType(source.slice(arrow + 2).trim(), environment),
      };
    }
  }

  if (source.startsWith("∀") || source.startsWith("∃")) {
    const comma = topLevelIndex(source, ",");
    if (comma >= 0) {
      const rawBinderText = source.slice(1, comma).trim();
      const implicit = rawBinderText.startsWith("{") && rawBinderText.endsWith("}");
      const binderText = implicit ? rawBinderText.slice(1, -1).trim() : rawBinderText;
      const body = source.slice(comma + 1).trim();
      const colon = topLevelIndex(binderText, ":");
      const names = (colon < 0 ? binderText : binderText.slice(0, colon)).trim().split(/\s+/);
      const domain = colon < 0
        ? inferImplicitBinderType(body, environment)
        : binderText.slice(colon + 1).trim();
      const remainingBody = names.length === 1
        ? body
        : implicit
          ? `${source[0]} {${names.slice(1).join(" ")} : ${domain}}, ${body}`
          : `${source[0]} ${names.slice(1).join(" ")} : ${domain}, ${body}`;
      return {
        kind: source[0] === "∀" ? "forall" : "exists",
        source,
        binder: names[0],
        domain: parseType(domain, environment),
        body: parseType(remainingBody, environment),
        implicit,
      };
    }
  }

  const binaryOperators = [
    { symbol: "↔", kind: "iff" },
    { symbol: "→", kind: "arrow" },
    { symbol: "∨", kind: "or" },
    { symbol: "∧", kind: "and" },
    { symbol: "=", kind: "equality" },
  ] as const;
  for (const operator of binaryOperators) {
    const parts = splitTop(source, operator.symbol);
    if (!parts) continue;
    if (operator.kind === "arrow") {
      return {
        kind: "arrow",
        source,
        domain: parseType(parts[0], environment),
        codomain: parseType(parts[1], environment),
      };
    }
    return {
      kind: operator.kind,
      source,
      left: parseType(parts[0], environment),
      right: parseType(parts[1], environment),
    };
  }

  if (source.startsWith("¬")) {
    return { kind: "negation", source, body: parseType(source.slice(1), environment) };
  }
  const application = splitTopLevelApplication(source);
  if (application) {
    return {
      kind: "application",
      source,
      fn: parseType(application[0], environment),
      argument: parseType(application[1], environment),
    };
  }
  return { kind: "atom", source };
}

export function peelFunction(type: string, environment: EnvironmentEntry[]): FunctionShape | null {
  const parsed = parseType(type, environment);
  if (parsed.kind === "arrow") {
    return { domain: parsed.domain.source, codomain: parsed.codomain.source };
  }
  if (parsed.kind === "negation") {
    return { domain: parsed.body.source, codomain: "False" };
  }
  if (parsed.kind === "forall") {
    return { binder: parsed.binder, implicit: parsed.implicit, domain: parsed.domain.source, codomain: parsed.body.source };
  }
  return null;
}

function parseExists(type: string, environment: EnvironmentEntry[]) {
  const parsed = parseType(type, environment);
  return parsed.kind === "exists"
    ? { binder: parsed.binder, witnessType: parsed.domain.source, body: parsed.body.source }
    : null;
}

function parseEquality(type: string) {
  const parsed = parseType(type, []);
  return parsed.kind === "equality"
    ? { left: parsed.left.source, right: parsed.right.source }
    : null;
}

function parseBinary(type: string, operator: "∧" | "∨" | "↔") {
  const parsed = parseType(type, []);
  const expectedKind = { "∧": "and", "∨": "or", "↔": "iff" }[operator];
  return parsed.kind === expectedKind && "left" in parsed
    ? { left: parsed.left.source, right: parsed.right.source }
    : null;
}

function isProposition(type: string, environment: EnvironmentEntry[]): boolean {
  const parsed = parseType(type, environment);
  if (["negation", "exists", "and", "or", "iff", "equality"].includes(parsed.kind)) {
    return true;
  }
  if (parsed.kind === "arrow") return isProposition(parsed.codomain.source, environment);
  if (parsed.kind === "forall") {
    return isProposition(parsed.body.source, [
      ...environment,
      { name: parsed.binder, type: parsed.domain.source },
    ]);
  }
  if (parsed.kind === "atom" && ["True", "False"].includes(parsed.source)) return true;
  return inferredTermType(parsed.source, environment) === "Prop";
}

function compact(value: string) {
  return stripTypeParens(value).replace(/\s+/g, "");
}

export function typesEqual(left: string, right: string) {
  return compact(renderParsedType(parseType(left, []))) ===
    compact(renderParsedType(parseType(right, [])));
}

function formatTypeSubstitution(type: string) {
  const replacement = stripTypeParens(type);
  const parsed = parseType(replacement, []);
  return parsed.kind === "atom" || parsed.kind === "meta" || parsed.kind === "application" || parsed.kind === "negation"
    ? replacement
    : `(${replacement})`;
}

function resolveType(type: string, substitutions: Record<number, string>) {
  const hasResolvedMeta = [...type.matchAll(/\?u(\d+)/g)]
    .some((match) => substitutions[Number(match[1])] !== undefined);
  if (!hasResolvedMeta && !/\bfun\b/.test(type)) return stripTypeParens(type);

  function render(node: ParsedType, seen: Set<number>): string {
    if (node.kind === "meta") {
      const replacement = substitutions[node.id];
      if (!replacement || seen.has(node.id)) return node.source;
      return render(parseType(replacement, []), new Set([...seen, node.id]));
    }
    if (node.kind === "atom") return node.source;
    if (node.kind === "application") {
      const fn = render(node.fn, seen);
      const argument = render(node.argument, seen);
      const resolvedFn = parseType(fn, []);
      if (resolvedFn.kind === "lambda") {
        const argumentExpression = parseTermExpression(argument);
        const substitution = argumentExpression
          ? printTermExpression(argumentExpression, 100)
          : formatTypeSubstitution(argument);
        return render(
          parseType(replaceToken(resolvedFn.body.source, resolvedFn.binder, substitution), []),
          seen,
        );
      }
      const fnText = resolvedFn.kind === "arrow" ? `(${fn})` : fn;
      const argumentNode = parseType(argument, []);
      const argumentText = ["atom", "meta"].includes(argumentNode.kind) &&
          !/[*+]|\+\+|::|[=→∧∨↔]/.test(argument)
        ? argument
        : `(${argument})`;
      return `${fnText} ${argumentText}`;
    }
    if (node.kind === "lambda") return `fun ${node.binder} => ${render(node.body, seen)}`;
    if (node.kind === "negation") {
      const body = render(node.body, seen);
      return ["atom", "meta", "application", "negation"].includes(parseType(body, []).kind)
        ? `¬${body}`
        : `¬(${body})`;
    }
    if (node.kind === "arrow") {
      const domain = render(node.domain, seen);
      const codomain = render(node.codomain, seen);
      const codomainKind = parseType(codomain, []).kind;
      const codomainText = codomainKind === "iff"
        ? `(${codomain})`
        : codomain;
      return `${formatTypeSubstitution(domain)} → ${codomainText}`;
    }
    if (node.kind === "forall" || node.kind === "exists") {
      const quantifier = node.kind === "forall" ? "∀" : "∃";
      const binder = `${node.binder} : ${render(node.domain, seen)}`;
      return `${quantifier} ${node.implicit ? `{${binder}}` : binder}, ${render(node.body, seen)}`;
    }
    const operator = { and: "∧", or: "∨", iff: "↔", equality: "=" }[node.kind];
    const left = render(node.left, seen);
    const right = render(node.right, seen);
    const leftKind = parseType(left, []).kind;
    const leftText = ["arrow", "forall", "exists", "and", "or", "iff", "equality"].includes(leftKind)
      ? `(${left})`
      : left;
    const rightText = ["arrow", "forall", "exists"].includes(parseType(right, []).kind) ? `(${right})` : right;
    return `${leftText} ${operator} ${rightText}`;
  }

  return stripTypeParens(render(parseType(type, []), new Set()));
}

function metaApplication(node: ParsedType) {
  const args: ParsedType[] = [];
  let current = node;
  while (current.kind === "application") {
    args.unshift(current.argument);
    current = current.fn;
  }
  return current.kind === "meta" ? { id: current.id, args } : null;
}

function inferredTermType(term: string, environment: EnvironmentEntry[]) {
  const expression = parseTermExpression(term);
  return expression ? inferTermExpressionType(expression, environment) : null;
}

function elaborateTermNotation(expression: TermExpression): TermExpression {
  if (expression.kind === "atom") return expression;
  if (expression.kind === "application") {
    return {
      kind: "application",
      fn: elaborateTermNotation(expression.fn),
      argument: elaborateTermNotation(expression.argument),
    };
  }

  const constants = {
    add: "Nat.add",
    mul: "Nat.mul",
    append: "List.append",
    cons: "List.cons",
  } as const;
  return {
    kind: "application",
    fn: {
      kind: "application",
      fn: { kind: "atom", value: constants[expression.kind] },
      argument: elaborateTermNotation(expression.left),
    },
    argument: elaborateTermNotation(expression.right),
  };
}

function restoreTermNotation(expression: TermExpression): TermExpression {
  if (expression.kind === "atom") return expression;
  if (expression.kind !== "application") {
    return {
      ...expression,
      left: restoreTermNotation(expression.left),
      right: restoreTermNotation(expression.right),
    };
  }

  if (expression.fn.kind === "application" && expression.fn.fn.kind === "atom") {
    const kinds = {
      "Nat.add": "add",
      "Nat.mul": "mul",
      "List.append": "append",
      "List.cons": "cons",
    } as const;
    const kind = kinds[expression.fn.fn.value as keyof typeof kinds];
    if (kind) {
      return {
        kind,
        left: restoreTermNotation(expression.fn.argument),
        right: restoreTermNotation(expression.argument),
      };
    }
  }
  return {
    kind: "application",
    fn: restoreTermNotation(expression.fn),
    argument: restoreTermNotation(expression.argument),
  };
}

function printElaboratedTerm(expression: TermExpression) {
  return printTermExpression(restoreTermNotation(expression));
}

function unifyTypeConstraints(
  left: string,
  right: string,
  environment: EnvironmentEntry[],
  initial: Record<number, string>,
  metaTypes: Record<number, string> = {},
  allowDeferred = false,
  initialTermSubstitutions: Record<string, string> = {},
) {
  const substitutions = { ...initial };
  const termSubstitutions = { ...initialTermSubstitutions };
  const deferred: TypeConstraint[] = [];

  function resolveTermMetas(value: string) {
    return resolveTermSubstitutions(value, termSubstitutions);
  }

  function bindTermMeta(placeholder: string, value: string) {
    const resolved = resolveTermMetas(value);
    if (resolved === placeholder) return true;
    if (new RegExp(`\\${placeholder}(?!\\d)`).test(resolved)) return false;
    termSubstitutions[placeholder] = resolved;
    return true;
  }

  function bindImplicitTermMeta(id: number, value: TermExpression) {
    const rendered = printElaboratedTerm(value);
    if (occurs(id, rendered)) return false;
    const declaredType = resolveType(metaTypes[id] ?? "", substitutions);
    const actualType = inferredTermType(rendered, environment);
    if (typesEqual(declaredType, "Prop") && !containsInternalMetavariable(rendered) &&
        !isProposition(rendered, environment)) return false;
    if (declaredType && actualType && !unify(declaredType, actualType)) return false;
    substitutions[id] = rendered;
    return true;
  }

  function unifyTermNodes(leftNode: TermExpression, rightNode: TermExpression): boolean {
    if (leftNode.kind === "atom" && /^\?a\d+$/.test(leftNode.value)) {
      return bindTermMeta(leftNode.value, printElaboratedTerm(rightNode));
    }
    if (rightNode.kind === "atom" && /^\?a\d+$/.test(rightNode.value)) {
      return bindTermMeta(rightNode.value, printElaboratedTerm(leftNode));
    }
    if (leftNode.kind === "atom" && /^\?u\d+$/.test(leftNode.value)) {
      return bindImplicitTermMeta(Number(leftNode.value.slice(2)), rightNode);
    }
    if (rightNode.kind === "atom" && /^\?u\d+$/.test(rightNode.value)) {
      return bindImplicitTermMeta(Number(rightNode.value.slice(2)), leftNode);
    }
    if (leftNode.kind !== rightNode.kind) return false;
    if (leftNode.kind === "atom" && rightNode.kind === "atom") {
      return leftNode.value === rightNode.value;
    }
    if (leftNode.kind === "application" && rightNode.kind === "application") {
      return unifyTermNodes(leftNode.fn, rightNode.fn) &&
        unifyTermNodes(leftNode.argument, rightNode.argument);
    }
    if (leftNode.kind !== "atom" && leftNode.kind !== "application" &&
        rightNode.kind !== "atom" && rightNode.kind !== "application") {
      return unifyTermNodes(leftNode.left, rightNode.left) &&
        unifyTermNodes(leftNode.right, rightNode.right);
    }
    return false;
  }

  function unifyTermText(leftText: string, rightText: string) {
    const before = { ...termSubstitutions };
    const beforeTypes = { ...substitutions };
    const parsedLeft = parseTermExpression(resolveTermMetas(leftText));
    const parsedRight = parseTermExpression(resolveTermMetas(rightText));
    const leftTerm = parsedLeft
      ? elaborateTermNotation(normalizeTermExpression(parsedLeft))
      : null;
    const rightTerm = parsedRight
      ? elaborateTermNotation(normalizeTermExpression(parsedRight))
      : null;
    const unified = Boolean(leftTerm && rightTerm && unifyTermNodes(leftTerm, rightTerm));
    if (!unified) {
      for (const placeholder of Object.keys(termSubstitutions)) delete termSubstitutions[placeholder];
      Object.assign(termSubstitutions, before);
      for (const id of Object.keys(substitutions)) delete substitutions[Number(id)];
      Object.assign(substitutions, beforeTypes);
    }
    return unified;
  }

  function sameTerm(leftTerm: TermExpression, rightTerm: TermExpression) {
    return printElaboratedTerm(leftTerm) === printElaboratedTerm(rightTerm);
  }

  function inferSharedUnaryFunction(leftTerm: TermExpression, rightTerm: TermExpression) {
    const marker: TermExpression = { kind: "atom", value: "__leanquest_arg" };

    function infer(leftNode: TermExpression, rightNode: TermExpression): {
      body: TermExpression;
      leftArgument: TermExpression;
      rightArgument: TermExpression;
      sharedDepth: number;
    } {
      if (leftNode.kind === "application" && rightNode.kind === "application") {
        if (sameTerm(leftNode.fn, rightNode.fn)) {
          const nested = infer(leftNode.argument, rightNode.argument);
          return { ...nested, body: { kind: "application", fn: leftNode.fn, argument: nested.body }, sharedDepth: nested.sharedDepth + 1 };
        }
        if (sameTerm(leftNode.argument, rightNode.argument)) {
          const nested = infer(leftNode.fn, rightNode.fn);
          return { ...nested, body: { kind: "application", fn: nested.body, argument: leftNode.argument }, sharedDepth: nested.sharedDepth + 1 };
        }
      }
      if ("left" in leftNode && "left" in rightNode && rightNode.kind === leftNode.kind) {
        if (sameTerm(leftNode.left, rightNode.left)) {
          const nested = infer(leftNode.right, rightNode.right);
          return { ...nested, body: { kind: leftNode.kind, left: leftNode.left, right: nested.body }, sharedDepth: nested.sharedDepth + 1 };
        }
        if (sameTerm(leftNode.right, rightNode.right)) {
          const nested = infer(leftNode.left, rightNode.left);
          return { ...nested, body: { kind: leftNode.kind, left: nested.body, right: leftNode.right }, sharedDepth: nested.sharedDepth + 1 };
        }
      }
      return { body: marker, leftArgument: leftNode, rightArgument: rightNode, sharedDepth: 0 };
    }

    const inferred = infer(leftTerm, rightTerm);
    return inferred.sharedDepth > 0 ? inferred : null;
  }

  function unifyCongruencePattern(pattern: ParsedType, actual: ParsedType) {
    if (pattern.kind !== "equality" || actual.kind !== "equality") return false;
    const flexibleApplication = (node: ParsedType) => {
      const args: ParsedType[] = [];
      let current = node;
      while (current.kind === "application") {
        args.unshift(current.argument);
        current = current.fn;
      }
      if (current.kind === "meta") return { head: `?u${current.id}`, implicitId: current.id, args };
      if (current.kind === "atom" && /^\?a\d+$/.test(current.source)) {
        return { head: current.source, placeholder: current.source, args };
      }
      return null;
    };
    const patternLeft = flexibleApplication(pattern.left);
    const patternRight = flexibleApplication(pattern.right);
    if (!patternLeft || !patternRight || patternLeft.head !== patternRight.head ||
        patternLeft.args.length !== 1 || patternRight.args.length !== 1 ||
        patternLeft.args[0].kind !== "meta" || patternRight.args[0].kind !== "meta") {
      return false;
    }
    const actualLeft = parseTermExpression(actual.left.source);
    const actualRight = parseTermExpression(actual.right.source);
    if (!actualLeft || !actualRight) return false;
    const shared = inferSharedUnaryFunction(
      elaborateTermNotation(normalizeTermExpression(actualLeft)),
      elaborateTermNotation(normalizeTermExpression(actualRight)),
    );
    if (!shared) return false;

    const before = { ...substitutions };
    if (!bindImplicitTermMeta(patternLeft.args[0].id, shared.leftArgument) ||
        !bindImplicitTermMeta(patternRight.args[0].id, shared.rightArgument)) {
      for (const id of Object.keys(substitutions)) delete substitutions[Number(id)];
      Object.assign(substitutions, before);
      return false;
    }

    const functionBody = `fun __leanquest_arg => ${printElaboratedTerm(shared.body)}`;
    if (patternLeft.implicitId !== undefined) {
      const functionType = resolveType(metaTypes[patternLeft.implicitId] ?? "", substitutions);
      const functionShape = peelFunction(functionType, environment);
      const argumentType = inferredTermType(printElaboratedTerm(shared.leftArgument), environment);
      const resultType = inferredTermType(printElaboratedTerm(actualLeft), environment);
      if ((functionShape && argumentType && !unify(functionShape.domain, argumentType)) ||
          (functionShape && resultType && !unify(functionShape.codomain, resultType))) {
        for (const id of Object.keys(substitutions)) delete substitutions[Number(id)];
        Object.assign(substitutions, before);
        return false;
      }
      substitutions[patternLeft.implicitId] = functionBody;
    } else if (!patternLeft.placeholder || !bindTermMeta(patternLeft.placeholder, functionBody)) {
      for (const id of Object.keys(substitutions)) delete substitutions[Number(id)];
      Object.assign(substitutions, before);
      return false;
    }
    return true;
  }

  function occurs(id: number, type: string) {
    return new RegExp(`\\?u${id}(?!\\d)`).test(resolveType(type, substitutions));
  }

  function unify(leftType: string, rightType: string): boolean {
    const resolvedLeft = resolveTermMetas(resolveType(leftType, substitutions));
    const resolvedRight = resolveTermMetas(resolveType(rightType, substitutions));
    if (typesEqual(resolvedLeft, resolvedRight)) return true;
    if (/^\?a\d+$/.test(resolvedLeft)) return bindTermMeta(resolvedLeft, resolvedRight);
    if (/^\?a\d+$/.test(resolvedRight)) return bindTermMeta(resolvedRight, resolvedLeft);
    const leftParsed = parseType(resolvedLeft, environment);
    const rightParsed = parseType(resolvedRight, environment);

    if (leftParsed.kind === "meta") {
      if (occurs(leftParsed.id, resolvedRight)) return false;
      const declaredType = resolveType(metaTypes[leftParsed.id] ?? "", substitutions);
      if (typesEqual(declaredType, "Prop") && !containsInternalMetavariable(resolvedRight) &&
          !isProposition(resolvedRight, environment)) return false;
      substitutions[leftParsed.id] = resolvedRight;
      return true;
    }
    if (rightParsed.kind === "meta") {
      if (occurs(rightParsed.id, resolvedLeft)) return false;
      const declaredType = resolveType(metaTypes[rightParsed.id] ?? "", substitutions);
      if (typesEqual(declaredType, "Prop") && !containsInternalMetavariable(resolvedLeft) &&
          !isProposition(resolvedLeft, environment)) return false;
      substitutions[rightParsed.id] = resolvedLeft;
      return true;
    }
    const leftMetaApplication = metaApplication(leftParsed);
    const rightMetaApplication = metaApplication(rightParsed);
    if (leftMetaApplication || rightMetaApplication) {
      const application = leftMetaApplication ?? rightMetaApplication!;
      const result = leftMetaApplication ? resolvedRight : resolvedLeft;
      const argumentNames = application.args.map((argument) => stripTypeParens(argument.source));
      if (new Set(argumentNames).size !== argumentNames.length ||
          argumentNames.some((argument) =>
            !/^[A-Za-z_][A-Za-z0-9_']*$/.test(argument) && !/^\?(?:a|u)\d+$/.test(argument)
          )) {
        return false;
      }
      if (allowDeferred && argumentNames.some((argument) => /^\?a\d+$/.test(argument))) {
        deferred.push({ left: resolvedLeft, right: resolvedRight, environment });
        return true;
      }
      let declaredType = resolveType(metaTypes[application.id] ?? "", substitutions);
      for (const argument of argumentNames) {
        if (declaredType) {
          const shape = peelFunction(declaredType, environment);
          if (!shape) return false;
          const actualType = inferredTermType(argument, environment);
          if (actualType && !unify(shape.domain, actualType)) return false;
          declaredType = shape.codomain;
        }
      }
      if (occurs(application.id, result)) return false;
      const binders = argumentNames.map((argument, index) =>
        /^\?(?:a|u)\d+$/.test(argument) ? `__metaArg${index}` : argument
      );
      const abstractionBody = argumentNames.reduce(
        (body, argument, index) => replaceBinderToken(body, argument, binders[index]),
        result,
      );
      substitutions[application.id] = binders.reduceRight(
        (body, binder) => `fun ${binder} => ${body}`,
        abstractionBody,
      );
      return true;
    }

    if (unifyTermText(resolvedLeft, resolvedRight)) return true;

    if (leftParsed.kind === "negation") return unify(`${leftParsed.body.source} → False`, resolvedRight);
    if (rightParsed.kind === "negation") return unify(resolvedLeft, `${rightParsed.body.source} → False`);
    if (leftParsed.kind === "forall" && rightParsed.kind === "arrow") {
      const inferred = matchDependentResult(
        leftParsed.body.source,
        rightParsed.codomain.source,
        leftParsed.binder,
      );
      const body = inferred
        ? replaceToken(leftParsed.body.source, leftParsed.binder, inferred)
        : leftParsed.body.source;
      return unify(leftParsed.domain.source, rightParsed.domain.source) &&
        unify(body, rightParsed.codomain.source);
    }
    if (rightParsed.kind === "forall" && leftParsed.kind === "arrow") {
      const inferred = matchDependentResult(
        rightParsed.body.source,
        leftParsed.codomain.source,
        rightParsed.binder,
      );
      const body = inferred
        ? replaceToken(rightParsed.body.source, rightParsed.binder, inferred)
        : rightParsed.body.source;
      return unify(leftParsed.domain.source, rightParsed.domain.source) &&
        unify(leftParsed.codomain.source, body);
    }
    if (leftParsed.kind !== rightParsed.kind) return false;

    if (leftParsed.kind === "arrow" && rightParsed.kind === "arrow") {
      return unify(leftParsed.domain.source, rightParsed.domain.source) &&
        unify(leftParsed.codomain.source, rightParsed.codomain.source);
    }
    if (leftParsed.kind === "application" && rightParsed.kind === "application") {
      return unify(leftParsed.fn.source, rightParsed.fn.source) &&
        unify(leftParsed.argument.source, rightParsed.argument.source);
    }
    if (leftParsed.kind === "lambda" && rightParsed.kind === "lambda") {
      return unify(
        leftParsed.body.source,
        replaceToken(rightParsed.body.source, rightParsed.binder, leftParsed.binder),
      );
    }
    if ((leftParsed.kind === "forall" || leftParsed.kind === "exists") &&
        rightParsed.kind === leftParsed.kind) {
      const renamedRightBody = replaceToken(rightParsed.body.source, rightParsed.binder, leftParsed.binder);
      return unify(leftParsed.domain.source, rightParsed.domain.source) &&
        unify(leftParsed.body.source, renamedRightBody);
    }
    if ("left" in leftParsed && "left" in rightParsed) {
      const before = { ...substitutions };
      const beforeTerms = { ...termSubstitutions };
      if (unify(leftParsed.left.source, rightParsed.left.source) &&
          unify(leftParsed.right.source, rightParsed.right.source)) {
        return true;
      }
      for (const id of Object.keys(substitutions)) delete substitutions[Number(id)];
      Object.assign(substitutions, before);
      for (const placeholder of Object.keys(termSubstitutions)) delete termSubstitutions[placeholder];
      Object.assign(termSubstitutions, beforeTerms);
      return unifyCongruencePattern(leftParsed, rightParsed) ||
        unifyCongruencePattern(rightParsed, leftParsed);
    }
    if (leftParsed.kind === "atom" && rightParsed.kind === "atom") {
      if (unifyTermText(leftParsed.source, rightParsed.source)) return true;
      if (allowDeferred && /\?a\d+/.test(`${resolvedLeft} ${resolvedRight}`)) {
        deferred.push({ left: resolvedLeft, right: resolvedRight, environment });
        return true;
      }
      return normalForm(leftParsed.source) === normalForm(rightParsed.source);
    }
    if (allowDeferred && /\?a\d+/.test(`${resolvedLeft} ${resolvedRight}`)) {
      deferred.push({ left: resolvedLeft, right: resolvedRight, environment });
      return true;
    }
    return false;
  }

  return unify(left, right) ? { substitutions, termSubstitutions, deferred } : null;
}

function unifyTypes(
  left: string,
  right: string,
  environment: EnvironmentEntry[],
  initial: Record<number, string>,
  metaTypes: Record<number, string> = {},
  termSubstitutions: Record<string, string> = {},
) {
  const unified = unifyTypeConstraints(left, right, environment, initial, metaTypes, false, termSubstitutions);
  return unified && !unified.deferred.length ? unified.substitutions : null;
}

function zonkNode(
  node: ProofNode,
  substitutions: Record<number, string>,
  termSubstitutions: Record<string, string>,
): ProofNode {
  const resolve = (value: string) => resolveSyntax(value, substitutions, termSubstitutions);
  if (node.kind === "term") return { ...node, type: resolve(node.type) };
  if (node.kind === "hole") {
    return {
      ...node,
      expected: resolve(node.expected),
      applicationTarget: node.applicationTarget
        ? resolve(node.applicationTarget)
        : undefined,
      environment: node.environment.map((entry) => ({ ...entry, type: resolve(entry.type) })),
      allowedTexts: node.allowedTexts?.map(resolve),
    };
  }
  return {
    ...node,
    type: resolve(node.type),
    children: node.children.map((child) => zonkNode(child, substitutions, termSubstitutions)),
  };
}

function withSubstitutions(state: ProofState, substitutions: Record<number, string>): ProofState {
  const resolve = (value: string) => resolveSyntax(value, substitutions, state.termSubstitutions);
  return {
    ...state,
    substitutions: Object.fromEntries(
      Object.entries(substitutions).map(([id, type]) => [id, resolve(type)]),
    ),
    root: zonkNode(state.root, substitutions, state.termSubstitutions),
    metaTypes: Object.fromEntries(
      Object.entries(state.metaTypes).map(([id, type]) => [id, resolve(type)]),
    ),
    constraints: state.constraints.map((constraint) => ({
      ...constraint,
      left: resolve(constraint.left),
      right: resolve(constraint.right),
    })),
  };
}

function canUnify(state: ProofState, left: string, right: string, environment: EnvironmentEntry[]) {
  return Boolean(unifyTypes(
    left,
    right,
    environment,
    state.substitutions,
    state.metaTypes,
    state.termSubstitutions,
  ));
}

function unifyPairs(
  state: ProofState,
  pairs: [string, string][],
  environment: EnvironmentEntry[],
) {
  let substitutions = state.substitutions;
  for (const [left, right] of pairs) {
    const unified = unifyTypes(
      left,
      right,
      environment,
      substitutions,
      state.metaTypes,
      state.termSubstitutions,
    );
    if (!unified) return null;
    substitutions = unified;
  }
  return substitutions;
}

function substituteTermTree(
  expression: TermExpression,
  token: string,
  replacement: TermExpression,
): TermExpression {
  if (expression.kind === "atom") return expression.value === token ? replacement : expression;
  if (expression.kind === "application") {
    return {
      kind: "application",
      fn: substituteTermTree(expression.fn, token, replacement),
      argument: substituteTermTree(expression.argument, token, replacement),
    };
  }
  return {
    kind: expression.kind,
    left: substituteTermTree(expression.left, token, replacement),
    right: substituteTermTree(expression.right, token, replacement),
  };
}

function rewriteTermTreeExact(
  expression: TermExpression,
  pattern: TermExpression,
  replacement: TermExpression,
  replaceAll: boolean,
): { expression: TermExpression; changed: boolean } {
  if (printElaboratedTerm(expression) === printElaboratedTerm(pattern)) {
    return { expression: replacement, changed: true };
  }
  if (expression.kind === "atom") return { expression, changed: false };
  if (expression.kind === "application") {
    const fn = rewriteTermTreeExact(expression.fn, pattern, replacement, replaceAll);
    if (fn.changed && !replaceAll) return { expression: { ...expression, fn: fn.expression }, changed: true };
    const argument = rewriteTermTreeExact(expression.argument, pattern, replacement, replaceAll);
    return {
      expression: { ...expression, fn: fn.expression, argument: argument.expression },
      changed: fn.changed || argument.changed,
    };
  }
  const left = rewriteTermTreeExact(expression.left, pattern, replacement, replaceAll);
  if (left.changed && !replaceAll) return { expression: { ...expression, left: left.expression }, changed: true };
  const right = rewriteTermTreeExact(expression.right, pattern, replacement, replaceAll);
  return {
    expression: { ...expression, left: left.expression, right: right.expression },
    changed: left.changed || right.changed,
  };
}

function rewriteSyntax(value: string, pattern: string, replacement: string, replaceAll = false) {
  const patternTerm = parseTermExpression(pattern);
  const replacementTerm = parseTermExpression(replacement);
  if (!patternTerm || !replacementTerm) return value;
  const rewritePattern = patternTerm;
  const rewriteReplacement = replacementTerm;

  function rewriteNode(node: ParsedType): ParsedType {
    const expression = parseTermExpression(node.source);
    if (expression) {
      const rewritten = rewriteTermTreeExact(expression, rewritePattern, rewriteReplacement, replaceAll);
      if (rewritten.changed) return parseType(printTermExpression(rewritten.expression), []);
    }
    if (node.kind === "meta" || node.kind === "atom") {
      return node;
    }
    if (node.kind === "application") return { ...node, fn: rewriteNode(node.fn), argument: rewriteNode(node.argument) };
    if (node.kind === "lambda" || node.kind === "negation") return { ...node, body: rewriteNode(node.body) };
    if (node.kind === "arrow") return { ...node, domain: rewriteNode(node.domain), codomain: rewriteNode(node.codomain) };
    if (node.kind === "forall" || node.kind === "exists") {
      return { ...node, domain: rewriteNode(node.domain), body: rewriteNode(node.body) };
    }
    return { ...node, left: rewriteNode(node.left), right: rewriteNode(node.right) };
  }

  return renderParsedType(rewriteNode(parseType(value, [])));
}

function substituteParsedType(node: ParsedType, token: string, replacement: ParsedType): ParsedType {
  if (node.kind === "meta" || node.kind === "atom") {
    if (node.source === token) return replacement;
    const expression = parseTermExpression(node.source);
    const replacementExpression = parseTermExpression(renderParsedType(replacement));
    if (!expression || !replacementExpression) return node;
    const substituted = substituteTermTree(expression, token, replacementExpression);
    return { kind: "atom", source: printTermExpression(substituted) };
  }
  if (node.kind === "application") {
    return {
      ...node,
      fn: substituteParsedType(node.fn, token, replacement),
      argument: substituteParsedType(node.argument, token, replacement),
    };
  }
  if (node.kind === "lambda") {
    return node.binder === token ? node : { ...node, body: substituteParsedType(node.body, token, replacement) };
  }
  if (node.kind === "negation") return { ...node, body: substituteParsedType(node.body, token, replacement) };
  if (node.kind === "arrow") {
    return {
      ...node,
      domain: substituteParsedType(node.domain, token, replacement),
      codomain: substituteParsedType(node.codomain, token, replacement),
    };
  }
  if (node.kind === "forall" || node.kind === "exists") {
    return {
      ...node,
      domain: substituteParsedType(node.domain, token, replacement),
      body: node.binder === token ? node.body : substituteParsedType(node.body, token, replacement),
    };
  }
  return {
    ...node,
    left: substituteParsedType(node.left, token, replacement),
    right: substituteParsedType(node.right, token, replacement),
  };
}

function replaceToken(value: string, token: string, replacement: string) {
  return renderParsedType(substituteParsedType(parseType(value, []), token, parseType(replacement, [])));
}

function replacePlaceholder(value: string, placeholder: string, replacement: string) {
  return replaceToken(value, placeholder, replacement);
}

function resolveTermSubstitutions(value: string, substitutions: Record<string, string>) {
  if (!/\?a\d+/.test(value)) return value;
  let resolved = value;
  for (let pass = 0; pass <= Object.keys(substitutions).length; pass += 1) {
    const next = Object.entries(substitutions).reduce(
      (text, [placeholder, replacement]) => text.includes(placeholder)
        ? replacePlaceholder(text, placeholder, replacement)
        : text,
      resolved,
    );
    if (next === resolved) break;
    resolved = next;
  }
  return resolved;
}

function resolveSyntax(
  value: string,
  substitutions: Record<number, string>,
  termSubstitutions: Record<string, string>,
) {
  let resolved = resolveType(value, substitutions);
  if (!/\?a\d+/.test(resolved)) return resolved;
  const limit = Object.keys(substitutions).length + Object.keys(termSubstitutions).length + 1;
  for (let pass = 0; pass <= limit; pass += 1) {
    const next = resolveType(resolveTermSubstitutions(resolved, termSubstitutions), substitutions);
    if (next === resolved) break;
    resolved = next;
  }
  return resolved;
}

function replaceBinderToken(value: string, token: string, replacement: string) {
  return token.startsWith("?")
    ? replacePlaceholder(value, token, replacement)
    : replaceToken(value, token, replacement);
}

function negate(type: string) {
  const text = stripTypeParens(type);
  return /[→∧∨↔]/.test(text) ? `¬(${text})` : `¬${text}`;
}

function propositionName(type: string) {
  const text = stripTypeParens(type);
  if (/^[A-Z][A-Za-z0-9_]*$/.test(text)) return `h${text}`;
  if (text.startsWith("¬")) return `hn${text.slice(1).replace(/\W/g, "") || "h"}`;
  const arrow = peelFunction(text, []);
  if (arrow) {
    const from = stripTypeParens(arrow.domain).replace(/\W/g, "").slice(-2);
    const to = stripTypeParens(arrow.codomain).replace(/\W/g, "").slice(-2);
    return `h${from}${to}` || "h";
  }
  return "h";
}

function freshName(base: string, environment: EnvironmentEntry[]) {
  const used = new Set(environment.map((entry) => entry.name));
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}${suffix}`)) suffix += 1;
  return `${base}${suffix}`;
}

function binderName(shape: FunctionShape, environment: EnvironmentEntry[]) {
  if (shape.binder && shape.binder !== "_") return freshName(shape.binder, environment);
  if (shape.domain === "Nat") return freshName("n", environment);
  if (shape.domain.startsWith("List ")) return freshName("xs", environment);
  if (["False", "True"].includes(shape.domain)) {
    return freshName(propositionName(shape.domain), environment);
  }
  if (environment.some((entry) => entry.name === shape.domain && entry.type === "Prop")) {
    return freshName(propositionName(shape.domain), environment);
  }
  if (/^[α-ωA-Za-z][A-Za-z0-9_]*$/.test(shape.domain) && shape.domain !== "Prop") {
    return freshName("x", environment);
  }
  return freshName(propositionName(shape.domain), environment);
}

export function parseEnvironment(declarations: string[]): EnvironmentEntry[] {
  const entries: EnvironmentEntry[] = [];
  for (const declaration of declarations) {
    const colon = declaration.indexOf(":");
    if (colon < 0) continue;
    const names = declaration.slice(0, colon).trim().split(/\s+/);
    const type = declaration.slice(colon + 1).trim();
    names.forEach((name) => entries.push({ name, type }));
  }
  return entries;
}

export function createProofState(theorem: string, declarations: string[]): ProofState {
  return {
    theorem,
    root: { kind: "hole", id: 1, expected: theorem, environment: parseEnvironment(declarations) },
    nextId: 2,
    nextMetaId: 0,
    substitutions: {},
    termSubstitutions: {},
    metaTypes: {},
    constraints: [],
    moves: [],
    tacticScript: [],
    tacticBranchPaths: [],
    tacticScriptLayouts: [],
  };
}

function holes(node: ProofNode): Extract<ProofNode, { kind: "hole" }>[] {
  if (node.kind === "hole") return [node];
  if (node.kind === "template") return node.children.flatMap(holes);
  return [];
}

function tacticBranchPath(node: ProofNode, holeId: number, path: number[] = []): number[] | null {
  if (node.kind === "hole") return node.id === holeId ? path : null;
  if (node.kind !== "template") return null;
  for (let index = 0; index < node.children.length; index += 1) {
    const childPath = node.tacticBranches ? [...path, index] : path;
    const found = tacticBranchPath(node.children[index], holeId, childPath);
    if (found) return found;
  }
  return null;
}

export function renderTacticProofLines(state: ProofState) {
  const entries = state.tacticScript.map((line, index) => ({
    line,
    path: state.tacticBranchPaths[index] ?? [],
    layout: state.tacticScriptLayouts[index] ?? null,
  }));

  const hasPrefix = (path: number[], prefix: number[]) =>
    prefix.every((part, index) => path[index] === part);

  const renderEntries = (
    scopedEntries: typeof entries,
    basePath: number[],
    indentOffset: number,
  ): string[] => {
    const lines: string[] = [];
    const seenBranches = new Set<string>();
    for (let index = 0; index < scopedEntries.length; index += 1) {
      const entry = scopedEntries[index];
      const relativePath = entry.path.slice(basePath.length);
      const branchKey = relativePath.join(".");
      const startsBranch = relativePath.length > 0 && !seenBranches.has(branchKey);
      if (startsBranch) seenBranches.add(branchKey);
      const lineIndent = indentOffset + relativePath.length + (startsBranch ? 0 : 1);
      const prefix = `${"  ".repeat(lineIndent)}${startsBranch ? "· " : ""}`;

      if (entry.layout?.kind !== "calc") {
        lines.push(`${prefix}${entry.line}`);
        continue;
      }

      lines.push(`${prefix}calc`);
      const calcIndent = lineIndent + (startsBranch ? 1 : 0);
      let scopeEnd = index + 1;
      while (scopeEnd < scopedEntries.length &&
          scopedEntries[scopeEnd].path.length > entry.path.length &&
          hasPrefix(scopedEntries[scopeEnd].path, entry.path)) {
        scopeEnd += 1;
      }
      const descendants = scopedEntries.slice(index + 1, scopeEnd);
      const stepExpressions = [
        `${entry.layout.left} = ${entry.layout.middle}`,
        `_ = ${entry.layout.right}`,
      ];
      for (let branch = 0; branch < stepExpressions.length; branch += 1) {
        lines.push(`${"  ".repeat(calcIndent + 1)}${stepExpressions[branch]} := by`);
        const branchPath = [...entry.path, branch];
        const branchEntries = descendants.filter((child) =>
          child.path.length >= branchPath.length && hasPrefix(child.path, branchPath)
        );
        if (branchEntries.length) {
          lines.push(...renderEntries(branchEntries, branchPath, calcIndent + 1));
        } else {
          lines.push(`${"  ".repeat(calcIndent + 2)}□`);
        }
      }
      index = scopeEnd - 1;
    }
    return lines;
  };

  return ["by", ...renderEntries(entries, [], 0)];
}

export function activeHole(state: ProofState) {
  const all = holes(state.root);
  if (!state.pending) {
    for (const constraint of state.constraints) {
      const placeholders = `${constraint.left} ${constraint.right}`.matchAll(/\?a(\d+)/g);
      for (const placeholder of placeholders) {
        const blocking = all.find((hole) => hole.termPlaceholder === `?a${placeholder[1]}`);
        if (blocking) return blocking;
      }
    }
    return all[0] ?? null;
  }
  return all.find((hole) => hole.id === state.pending!.holeId) ?? all[0] ?? null;
}

function replaceHole(node: ProofNode, id: number, replacement: ProofNode): ProofNode {
  if (node.kind === "hole") return node.id === id ? replacement : node;
  if (node.kind === "template") {
    return { ...node, children: node.children.map((child) => replaceHole(child, id, replacement)) };
  }
  return node;
}

function updateHole(
  node: ProofNode,
  id: number,
  update: (hole: Extract<ProofNode, { kind: "hole" }>) => ProofNode,
): ProofNode {
  if (node.kind === "hole") return node.id === id ? update(node) : node;
  if (node.kind === "template") {
    return { ...node, children: node.children.map((child) => updateHole(child, id, update)) };
  }
  return node;
}

function applicationHeadPath(node: ProofNode, holeId: number): ProofNode[] | null {
  if (node.kind === "hole") return node.id === holeId ? [] : null;
  if (node.kind === "template" && node.precedence === "application") {
    const functionPath = applicationHeadPath(node.children[0], holeId);
    if (functionPath) return [...functionPath, node.children[1]];
  }
  return null;
}

function applicationArgumentsFollowingHole(node: ProofNode, holeId: number): ProofNode[] | null {
  const headPath = applicationHeadPath(node, holeId);
  if (headPath) return headPath;
  if (node.kind !== "template") return null;
  for (const child of node.children) {
    const path = applicationArgumentsFollowingHole(child, holeId);
    if (path) return path;
  }
  return null;
}

function nodePrecedence(node: ProofNode) {
  if (node.kind === "term") {
    if (node.text.startsWith("fun ")) return 10;
    const expression = parseTermExpression(node.text);
    if (expression && ["add", "mul", "append", "cons"].includes(expression.kind)) return 15;
    if (expression?.kind === "application") return 20;
    return 100;
  }
  if (node.kind !== "template") return 100;
  if (node.precedence === "lambda") return 10;
  if (node.precedence === "application") return 20;
  return 100;
}

function parenthesize(parts: ProofDisplayPart[]) {
  return [{ text: "(" }, ...parts, { text: ")" }];
}

function renderNodeParts(
  node: ProofNode,
  state: ProofState,
  focusedHoleId?: number,
  minimumPrecedence = 0,
): ProofDisplayPart[] {
  if (node.kind === "term") {
    const parts = [{ text: node.text }];
    return nodePrecedence(node) < minimumPrecedence ? parenthesize(parts) : parts;
  }
  if (node.kind === "hole") {
    if (state.pending?.kind === "dot-source" && state.pending.holeId === node.id) {
      return [
        { text: "□", hole: true, active: true },
        { text: "." },
        { text: "□", hole: true, active: false },
      ];
    }
    if (state.pending?.kind === "dot-function" && state.pending.holeId === node.id) {
      return [
        { text: state.pending.source.text },
        { text: "." },
        { text: "□", hole: true, active: true },
      ];
    }
    return [{ text: "□", hole: true, active: node.id === focusedHoleId }];
  }

  const precedence = nodePrecedence(node);
  let parts: ProofDisplayPart[];
  if (node.precedence === "application") {
    parts = [
      ...renderNodeParts(node.children[0], state, focusedHoleId, precedence),
      { text: " " },
      ...renderNodeParts(node.children[1], state, focusedHoleId, precedence + 1),
    ];
  } else {
    const childPrecedence = node.precedence === "lambda" ? precedence : 0;
    parts = node.format.split(/(\{\d+\})/).flatMap((piece) => {
      const placeholder = piece.match(/^\{(\d+)\}$/);
      return placeholder
        ? renderNodeParts(node.children[Number(placeholder[1])], state, focusedHoleId, childPrecedence)
        : piece ? [{ text: piece }] : [];
    });
  }
  return precedence < minimumPrecedence ? parenthesize(parts) : parts;
}

export function renderProofParts(state: ProofState) {
  return renderNodeParts(state.root, state, activeHole(state)?.id);
}

export function renderProof(state: ProofState) {
  return renderProofParts(state).map((part) => part.text).join("");
}

function containsInternalMetavariable(value: string) {
  return /\?(?:a|u)\d+/.test(value);
}

function closedTypesCompatible(left: string, right: string) {
  if (typesDefinitionallyEqual(left, right)) return true;
  const unified = unifyTypeConstraints(left, right, [], {}, {}, false, {});
  return Boolean(unified && !unified.deferred.length);
}

function proofNodeIsClosed(node: ProofNode): boolean {
  const type = node.kind === "hole" ? node.expected : node.type;
  if (containsInternalMetavariable(type)) return false;
  if (node.kind === "term") return !containsInternalMetavariable(node.text);
  if (node.kind === "hole") return false;
  return node.children.every(proofNodeIsClosed);
}

function inferClosedProofNodeType(node: ProofNode, state: ProofState): string | null {
  if (node.kind === "hole") return null;
  if (node.kind === "term") return node.type;

  if (node.precedence === "application" && node.children.length === 2) {
    const [fn, argument] = node.children;
    const fnType = inferClosedProofNodeType(fn, state);
    const argumentType = inferClosedProofNodeType(argument, state);
    if (!fnType || !argumentType) return null;
    let explicitFnType = fnType;
    let shape = peelFunction(explicitFnType, []);
    while (shape?.implicit) {
      explicitFnType = shape.codomain;
      shape = peelFunction(explicitFnType, []);
    }
    if (!shape || (shape.domain !== "_" && !closedTypesCompatible(shape.domain, argumentType))) return null;
    return node.type;
  }

  if (node.precedence === "lambda" && node.children.length === 1) {
    const shape = peelFunction(node.type, []);
    const bodyType = inferClosedProofNodeType(node.children[0], state);
    if (!shape || !bodyType) return null;
    const binder = node.format.match(/^fun\s+(?:\{)?([^}\s]+)(?:\})?\s+=>/)?.[1] ?? shape.binder;
    const expectedBody = shape.binder && binder
      ? replaceToken(shape.codomain, shape.binder, binder)
      : shape.codomain;
    if (!closedTypesCompatible(expectedBody, bodyType)) return null;
    return node.type;
  }

  return node.children.every((child) => inferClosedProofNodeType(child, state) !== null)
    ? node.type
    : null;
}

export function isSolved(state: ProofState) {
  if (holes(state.root).length || state.pending || state.constraints.length) return false;
  if (state.root.kind === "hole") return false;
  const rootType = resolveSyntax(state.root.type, state.substitutions, state.termSubstitutions);
  const theorem = resolveSyntax(state.theorem, state.substitutions, state.termSubstitutions);
  if (!proofNodeIsClosed(state.root)) return false;
  const inferredRootType = inferClosedProofNodeType(state.root, state);
  return inferredRootType !== null &&
    !containsInternalMetavariable(renderProof(state)) &&
    !containsInternalMetavariable(rootType) &&
    !containsInternalMetavariable(theorem) &&
    closedTypesCompatible(rootType, theorem) &&
    closedTypesCompatible(inferredRootType, theorem);
}

function substituteTermPlaceholder(node: ProofNode, placeholder: string, replacement: string): ProofNode {
  if (node.kind === "term") {
    return {
      ...node,
      type: replacePlaceholder(node.type, placeholder, replacement),
      termPlaceholder: node.termPlaceholder === placeholder ? undefined : node.termPlaceholder,
    };
  }
  if (node.kind === "hole") {
    return {
      ...node,
      expected: replacePlaceholder(node.expected, placeholder, replacement),
      applicationTarget: node.applicationTarget
        ? replacePlaceholder(node.applicationTarget, placeholder, replacement)
        : undefined,
      environment: node.environment.map((entry) => ({
        ...entry,
        type: replacePlaceholder(entry.type, placeholder, replacement),
      })),
      termPlaceholder: node.termPlaceholder === placeholder ? undefined : node.termPlaceholder,
    };
  }
  return {
    ...node,
    type: replacePlaceholder(node.type, placeholder, replacement),
    children: node.children.map((child) => substituteTermPlaceholder(child, placeholder, replacement)),
    termPlaceholder: node.termPlaceholder === placeholder ? undefined : node.termPlaceholder,
  };
}

function completedPlaceholderNode(node: ProofNode): ProofNode | null {
  if (node.termPlaceholder && holes(node).length === 0) return node;
  if (node.kind !== "template") return null;
  for (const child of node.children) {
    const completed = completedPlaceholderNode(child);
    if (completed) return completed;
  }
  return null;
}

function applyTermSolutionsToNode(
  node: ProofNode,
  solutions: Record<string, string>,
): ProofNode {
  const resolve = (value: string) => resolveTermSubstitutions(value, solutions);
  if (node.kind === "term") return { ...node, type: resolve(node.type) };
  if (node.kind === "hole") {
    const inferred = node.termPlaceholder && solutions[node.termPlaceholder]
      ? resolve(solutions[node.termPlaceholder])
      : undefined;
    return {
      ...node,
      expected: resolve(node.expected),
      applicationTarget: node.applicationTarget ? resolve(node.applicationTarget) : undefined,
      environment: node.environment.map((entry) => ({ ...entry, type: resolve(entry.type) })),
      allowedTexts: inferred
        ? [inferred]
        : node.allowedTexts?.map(resolve),
    };
  }
  return {
    ...node,
    type: resolve(node.type),
    children: node.children.map((child) => applyTermSolutionsToNode(child, solutions)),
  };
}

function solveDeferredConstraints(state: ProofState) {
  let substitutions = state.substitutions;
  let termSubstitutions = state.termSubstitutions;
  const deferred: TypeConstraint[] = [];
  for (const constraint of state.constraints) {
    const unified = unifyTypeConstraints(
      constraint.left,
      constraint.right,
      constraint.environment,
      substitutions,
      state.metaTypes,
      true,
      termSubstitutions,
    );
    if (!unified) return state;
    substitutions = unified.substitutions;
    termSubstitutions = unified.termSubstitutions;
    deferred.push(...unified.deferred);
  }
  const resolvedConstraints = deferred.map((constraint) => ({
    ...constraint,
    left: resolveTermSubstitutions(constraint.left, termSubstitutions),
    right: resolveTermSubstitutions(constraint.right, termSubstitutions),
  }));
  return withSubstitutions({
    ...state,
    termSubstitutions,
    root: applyTermSolutionsToNode(state.root, termSubstitutions),
    constraints: resolvedConstraints,
  }, substitutions);
}

function instantiateCompletedTermArguments(state: ProofState): ProofState {
  let next = state;
  for (;;) {
    const completed = completedPlaceholderNode(next.root);
    if (!completed?.termPlaceholder) return next;
    const replacement = renderNodeParts(completed, next).map((part) => part.text).join("");
    const placeholder = completed.termPlaceholder;
    const termSubstitutions = {
      ...next.termSubstitutions,
      [placeholder]: resolveTermSubstitutions(replacement, next.termSubstitutions),
    };
    next = {
      ...next,
      termSubstitutions,
      root: substituteTermPlaceholder(next.root, placeholder, replacement),
      substitutions: Object.fromEntries(
        Object.entries(next.substitutions).map(([id, type]) => [
          id,
          replacePlaceholder(type, placeholder, replacement),
        ]),
      ),
      metaTypes: Object.fromEntries(
        Object.entries(next.metaTypes).map(([id, type]) => [
          id,
          replacePlaceholder(type, placeholder, replacement),
        ]),
      ),
      constraints: next.constraints.map((constraint) => ({
        ...constraint,
        left: replacePlaceholder(constraint.left, placeholder, replacement),
        right: replacePlaceholder(constraint.right, placeholder, replacement),
      })),
    };
    next = solveDeferredConstraints(next);
  }
}

function advance(
  state: ProofState,
  label: string,
  root = state.root,
  nextId = state.nextId,
  pending?: Pending,
  nextMetaId = state.nextMetaId,
): ProofState {
  return {
    theorem: state.theorem,
    root,
    nextId,
    nextMetaId,
    substitutions: state.substitutions,
    termSubstitutions: state.termSubstitutions,
    metaTypes: state.metaTypes,
    constraints: state.constraints,
    pending,
    moves: [...state.moves, label],
    tacticScript: state.tacticScript,
    tacticBranchPaths: state.tacticBranchPaths,
    tacticScriptLayouts: state.tacticScriptLayouts,
  };
}

function fill(state: ProofState, holeId: number, node: ProofNode, label: string, nextId = state.nextId) {
  const replacedHole = holes(state.root).find((hole) => hole.id === holeId);
  const replacement = replacedHole?.termPlaceholder
    ? { ...node, termPlaceholder: replacedHole.termPlaceholder }
    : node;
  return instantiateCompletedTermArguments(
    advance(state, label, replaceHole(state.root, holeId, replacement), nextId),
  );
}

function newHole(state: ProofState, expected: string, environment: EnvironmentEntry[], allowedTexts?: string[]) {
  return {
    hole: { kind: "hole" as const, id: state.nextId, expected, environment, allowedTexts },
    nextId: state.nextId + 1,
  };
}

function candidateTerms(
  _state: ProofState,
  environment: EnvironmentEntry[],
  unlocks: UnlockedMoves,
  target = "",
): TermCandidate[] {
  return collectCandidateTerms({
    environment,
    unlocks,
    includeCatalogue: Boolean(target),
    libraryTermTypes,
  });
}

const dotNotationFunctions = new Set([
  "And.left",
  "And.right",
  "Iff.mp",
  "Iff.mpr",
]);

function projectionCandidates(
  state: ProofState,
  environment: EnvironmentEntry[],
  unlocks: UnlockedMoves,
  includeCatalogueSources = true,
): ProjectionCandidate<ProofState>[] {
  if (!hasMove(unlocks, "term.dot")) return [];
  const candidates = candidateTerms(state, environment, unlocks, "projection");
  const functions = candidates
    .filter((candidate) => dotNotationFunctions.has(candidate.text));
  const sources = includeCatalogueSources
    ? candidates
    : candidateTerms(state, environment, unlocks);
  return projectionCandidateProvider({
    state,
    environment,
    sources,
    functions,
    prepareFunction: instantiateCandidateImplicits,
    firstExplicitShape: (type, shapeEnvironment) => peelFunction(type, shapeEnvironment),
    unifyDomain: (candidateState, domain, sourceType, shapeEnvironment) =>
      unifyPairs(candidateState, [[domain, sourceType]], shapeEnvironment),
    applySubstitutions: withSubstitutions,
    resolveType,
  });
}

function dotOptions(state: ProofState, environment: EnvironmentEntry[], target: string, unlocks: UnlockedMoves) {
  const projections = projectionCandidates(state, environment, unlocks);
  return projections.flatMap((projection, index) => {
    if (projections.findIndex((candidate) =>
      candidate.source.text === projection.source.text &&
      candidate.source.type === projection.source.type
    ) !== index) return [];
    const compatible = projections.flatMap((candidate) => {
      if (candidate.source.text !== projection.source.text ||
          candidate.source.type !== projection.source.type) return [];
      const substitutions = unifyPairs(candidate.state, [[candidate.type, target]], environment);
      return substitutions ? [{
        candidate: candidate.projection,
        candidateState: candidate.state,
        shape: { domain: candidate.source.type, codomain: candidate.type },
        name: candidate.name,
        substitutions,
      }] : [];
    });
    return compatible.length ? [{ source: projection.source, functions: compatible }] : [];
  });
}

function dotTermCandidates(state: ProofState, environment: EnvironmentEntry[], target: string, unlocks: UnlockedMoves) {
  return dotOptions(state, environment, target, unlocks).flatMap(({ source, functions }) =>
    functions.map(({ name, shape, substitutions }) => ({
      text: `${source.text}.${name}`,
      type: resolveType(shape.codomain, substitutions),
    }))
  );
}

function matchDependentResult(body: string, target: string, binder: string) {
  if (typesEqual(body, target)) return undefined;
  let inferred: string | undefined;

  const bind = (value: string) => {
    const rendered = renderParsedType(parseType(value, []));
    if (inferred === undefined) inferred = rendered;
    return typesEqual(inferred, rendered);
  };
  const matchTerm = (pattern: TermExpression, actual: TermExpression): boolean => {
    if (pattern.kind === "atom" && pattern.value === binder) {
      return bind(printTermExpression(actual));
    }
    if (pattern.kind !== actual.kind) return false;
    if (pattern.kind === "atom" && actual.kind === "atom") return pattern.value === actual.value;
    if (pattern.kind === "application" && actual.kind === "application") {
      return matchTerm(pattern.fn, actual.fn) && matchTerm(pattern.argument, actual.argument);
    }
    return pattern.kind !== "atom" && pattern.kind !== "application" &&
      actual.kind !== "atom" && actual.kind !== "application" &&
      matchTerm(pattern.left, actual.left) && matchTerm(pattern.right, actual.right);
  };
  const matchType = (pattern: ParsedType, actual: ParsedType): boolean => {
    if (pattern.source === binder) return bind(renderParsedType(actual));
    if (pattern.kind !== actual.kind) return false;
    if (pattern.kind === "meta" && actual.kind === "meta") return pattern.id === actual.id;
    if (pattern.kind === "atom" && actual.kind === "atom") {
      const patternTerm = parseTermExpression(pattern.source);
      const actualTerm = parseTermExpression(actual.source);
      return patternTerm && actualTerm
        ? matchTerm(patternTerm, actualTerm)
        : pattern.source === actual.source;
    }
    if (pattern.kind === "application" && actual.kind === "application") {
      return matchType(pattern.fn, actual.fn) && matchType(pattern.argument, actual.argument);
    }
    if (pattern.kind === "lambda" && actual.kind === "lambda") {
      return pattern.binder === actual.binder && matchType(pattern.body, actual.body);
    }
    if (pattern.kind === "negation" && actual.kind === "negation") return matchType(pattern.body, actual.body);
    if (pattern.kind === "arrow" && actual.kind === "arrow") {
      return matchType(pattern.domain, actual.domain) && matchType(pattern.codomain, actual.codomain);
    }
    if ((pattern.kind === "forall" || pattern.kind === "exists") && actual.kind === pattern.kind) {
      return pattern.implicit === actual.implicit && matchType(pattern.domain, actual.domain) &&
        matchType(pattern.body, actual.body);
    }
    return "left" in pattern && "left" in actual && pattern.kind === actual.kind &&
      matchType(pattern.left, actual.left) && matchType(pattern.right, actual.right);
  };

  if (!matchType(parseType(body, []), parseType(target, []))) return undefined;
  if (!inferred) return undefined;
  const instantiated = replaceBinderToken(body, binder, inferred);
  return typesDefinitionallyEqual(instantiated, target) ? inferred : undefined;
}

type ApplicableFunction = TermCandidate & {
  domains: { type: string; inferredText?: string; termPlaceholder?: string }[];
  candidateState: ProofState;
  substitutions: Record<number, string>;
};

type ApplicableCandidate = TermCandidate & { candidateState?: ProofState };

function applicableFunctions(
  state: ProofState,
  environment: EnvironmentEntry[],
  target: string,
  unlocks: UnlockedMoves,
  allPremises: boolean,
): ApplicableFunction[] {
  const results: ApplicableFunction[] = [];
  const ordinaryCandidates: ApplicableCandidate[] = candidateTerms(state, environment, unlocks, target);
  const projectedCandidates: ApplicableCandidate[] = projectionCandidates(state, environment, unlocks, false)
    .map((candidate) => ({
      text: candidate.text,
      type: candidate.type,
      candidateState: candidate.state,
    }));
  const candidates = [...new Map(
    [...ordinaryCandidates, ...projectedCandidates].map((candidate) => [
      `${candidate.text}:${candidate.type}`,
      candidate,
    ])
  ).values()];
  for (const candidate of candidates) {
    const { candidateState, ...term } = candidate;
    const prepared = instantiateCandidateImplicits(candidateState ?? state, term);
    let current = prepared.candidate.type;
    let substitutions = prepared.state.substitutions;
    let termSubstitutions = prepared.state.termSubstitutions;
    const domains: ApplicableFunction["domains"] = [];
    for (let depth = 0; depth < 8; depth += 1) {
      const shape = peelFunction(
        resolveSyntax(current, substitutions, termSubstitutions),
        environment,
      );
      if (!shape) break;
      const argumentId = prepared.state.nextId + domains.length;
      const termPlaceholder = shape.binder ? `?a${argumentId}` : undefined;
      domains.push({
        type: resolveSyntax(shape.domain, substitutions, termSubstitutions),
        termPlaceholder,
      });
      if (shape.binder) {
        current = replaceBinderToken(shape.codomain, shape.binder, termPlaceholder!);
      } else {
        current = shape.codomain;
      }
      const unified = unifyTypeConstraints(
        current,
        target,
        environment,
        substitutions,
        prepared.state.metaTypes,
        false,
        termSubstitutions,
      );
      if (unified && !unified.deferred.length) {
        substitutions = unified.substitutions;
        termSubstitutions = unified.termSubstitutions;

        let validArguments = true;
        for (const domain of domains) {
          if (!domain.termPlaceholder || !termSubstitutions[domain.termPlaceholder]) continue;
          const inferredText = resolveTermSubstitutions(
            termSubstitutions[domain.termPlaceholder],
            termSubstitutions,
          );
          const inferredType = inferredTermType(inferredText, environment);
          if (!inferredType) continue;
          const domainMatch = unifyTypeConstraints(
            domain.type,
            inferredType,
            environment,
            substitutions,
            prepared.state.metaTypes,
            false,
            termSubstitutions,
          );
          if (!domainMatch || domainMatch.deferred.length) {
            validArguments = false;
            break;
          }
          substitutions = domainMatch.substitutions;
          termSubstitutions = domainMatch.termSubstitutions;
        }

        if (!validArguments) {
          break;
        }

        if (allPremises || domains.length === 1) {
          const matchedState = withSubstitutions({
            ...prepared.state,
            termSubstitutions,
          }, substitutions);
          results.push({
            ...prepared.candidate,
            type: resolveSyntax(prepared.candidate.type, substitutions, termSubstitutions),
            domains: domains.map((domain) => ({
              type: resolveSyntax(domain.type, substitutions, termSubstitutions),
              inferredText: domain.termPlaceholder && termSubstitutions[domain.termPlaceholder]
                ? resolveTermSubstitutions(termSubstitutions[domain.termPlaceholder], termSubstitutions)
                : undefined,
              termPlaceholder: domain.termPlaceholder && !termSubstitutions[domain.termPlaceholder]
                ? domain.termPlaceholder
                : undefined,
            })),
            candidateState: matchedState,
            substitutions,
          });
        }
        break;
      }
      if (!allPremises) break;
    }
  }
  return results;
}

function directLibraryTerms(expected: string, unlocks: UnlockedMoves): TermCandidate[] {
  const equality = parseEquality(expected);
  const leftTerm = equality ? parseTermExpression(equality.left) : null;
  const rightTerm = equality ? parseTermExpression(equality.right) : null;
  const result: TermCandidate[] = [];
  if (hasMove(unlocks, "catalogue.eqRefl") && equality && definitionallyEqual(equality.left, equality.right)) {
    result.push({ text: `Eq.refl ${stripTypeParens(equality.left)}`, type: expected });
  }
  if (hasMove(unlocks, "catalogue.classicalEm")) {
    const disjunction = parseBinary(expected, "∨");
    if (disjunction && typesEqual(disjunction.right, negate(disjunction.left))) {
      result.push({ text: `Classical.em ${stripTypeParens(disjunction.left)}`, type: expected });
    }
  }
  if (hasMove(unlocks, "catalogue.natAddComm") &&
      leftTerm?.kind === "add" && rightTerm?.kind === "add") {
    const leftA = printTermExpression(leftTerm.left);
    const leftB = printTermExpression(leftTerm.right);
    const rightA = printTermExpression(rightTerm.left);
    const rightB = printTermExpression(rightTerm.right);
    if (typesEqual(leftA, rightB) && typesEqual(leftB, rightA)) {
      result.push({ text: `Nat.add_comm ${leftA} ${leftB}`, type: expected });
    }
  }
  const hasAppend = (term: TermExpression | null) => Boolean(
    term && termContains(term, (node) => node.kind === "append")
  );
  if (hasMove(unlocks, "catalogue.listAppendAssoc") && hasAppend(leftTerm) && hasAppend(rightTerm)) {
    const names = [...expected.matchAll(/\b(?:xs|ys|zs)\b/g)].map((match) => match[0]);
    if (new Set(names).size >= 3) result.push({ text: "List.append_assoc xs ys zs", type: expected });
  }
  const hasLength = (term: TermExpression | null) => Boolean(
    term && termContains(term, (node) => termApplicationHead(node) === "List.length")
  );
  if (hasMove(unlocks, "catalogue.listLengthAppend") && hasLength(leftTerm) && hasAppend(leftTerm)) {
    result.push({ text: "List.length_append", type: expected });
  }
  return result;
}

type TermExpression =
  | { kind: "atom"; value: string }
  | { kind: "application"; fn: TermExpression; argument: TermExpression }
  | { kind: "add"; left: TermExpression; right: TermExpression }
  | { kind: "mul"; left: TermExpression; right: TermExpression }
  | { kind: "append"; left: TermExpression; right: TermExpression }
  | { kind: "cons"; left: TermExpression; right: TermExpression };

function termTokens(value: string) {
  const tokens: string[] = [];
  const pattern = /\s*(\[\]|\+\+|::|\.(?:length|reverse)|[()*+]|\d+|[\p{L}_?][\p{L}\p{N}_?.']*)/guy;
  let index = 0;
  while (index < value.length) {
    pattern.lastIndex = index;
    const match = pattern.exec(value);
    if (!match || match.index !== index) return null;
    tokens.push(match[1]);
    index = pattern.lastIndex;
  }
  return tokens;
}

const termExpressionCache = new Map<string, TermExpression | null>();

function parseTermExpression(value: string): TermExpression | null {
  const source = value.trim();
  if (termExpressionCache.has(source)) return termExpressionCache.get(source)!;
  const parsed = parseTermExpressionUncached(source);
  termExpressionCache.set(source, parsed);
  return parsed;
}

function parseTermExpressionUncached(value: string): TermExpression | null {
  const scannedTokens = termTokens(value.trim());
  if (!scannedTokens?.length) return null;
  const tokens = scannedTokens;
  let index = 0;

  const startsPrimary = (token?: string) => Boolean(
    token && ![")", "*", "+", "++", "::", ".length", ".reverse"].includes(token)
  );
  const infix = (token?: string) => {
    if (token === "*") return { kind: "mul" as const, precedence: 70, rightAssociative: false };
    if (token === "+") return { kind: "add" as const, precedence: 60, rightAssociative: false };
    if (token === "++") return { kind: "append" as const, precedence: 55, rightAssociative: true };
    if (token === "::") return { kind: "cons" as const, precedence: 50, rightAssociative: true };
    return null;
  };

  function primary(): TermExpression | null {
    const token = tokens[index++];
    if (!token) return null;
    let expression: TermExpression;
    if (token === "(") {
      const nested = parse(0);
      if (!nested || tokens[index++] !== ")") return null;
      expression = nested;
    } else {
      if ([")", "*", "+", "++", "::", ".length", ".reverse"].includes(token)) return null;
      const projection = ["List.length", "List.reverse"].includes(token)
        ? null
        : token.match(/^(.+)\.(length|reverse)$/);
      expression = projection
        ? {
          kind: "application",
          fn: { kind: "atom", value: `List.${projection[2]}` },
          argument: { kind: "atom", value: projection[1] },
        }
        : { kind: "atom", value: token };
    }
    while ([".length", ".reverse"].includes(tokens[index])) {
      const projection = tokens[index].slice(1);
      index += 1;
      expression = {
        kind: "application",
        fn: { kind: "atom", value: `List.${projection}` },
        argument: expression,
      };
    }
    return expression;
  }

  function parse(minimumPrecedence: number): TermExpression | null {
    const first = primary();
    if (!first) return null;
    let left: TermExpression = first;
    for (;;) {
      const operator = infix(tokens[index]);
      if (operator && operator.precedence >= minimumPrecedence) {
        index += 1;
        const right = parse(operator.rightAssociative ? operator.precedence : operator.precedence + 1);
        if (!right) return null;
        left = { kind: operator.kind, left, right };
        continue;
      }
      if (startsPrimary(tokens[index]) && 90 >= minimumPrecedence) {
        const argument = parse(91);
        if (!argument) return null;
        left = { kind: "application", fn: left, argument };
        continue;
      }
      break;
    }
    return left;
  }

  const expression = parse(0);
  return expression && index === tokens.length ? expression : null;
}

export function termSyntaxKind(value: string) {
  return parseTermExpression(value)?.kind ?? "invalid";
}

function termPrecedence(expression: TermExpression) {
  if (expression.kind === "atom") return 100;
  if (expression.kind === "application") return 90;
  if (expression.kind === "mul") return 70;
  if (expression.kind === "add") return 60;
  if (expression.kind === "append") return 55;
  return 50;
}

function printTermExpression(expression: TermExpression, minimumPrecedence = 0): string {
  const precedence = termPrecedence(expression);
  let text: string;
  if (expression.kind === "atom") {
    text = expression.value;
  } else if (expression.kind === "application") {
    text = `${printTermExpression(expression.fn, precedence)} ` +
      printTermExpression(expression.argument, precedence + 1);
  } else {
    const operator = { add: "+", mul: "*", append: "++", cons: "::" }[expression.kind];
    const rightAssociative = !["add", "mul"].includes(expression.kind);
    text = `${printTermExpression(expression.left, precedence + (rightAssociative ? 1 : 0))} ${operator} ` +
      printTermExpression(expression.right, precedence + (rightAssociative ? 0 : 1));
  }
  return precedence < minimumPrecedence ? `(${text})` : text;
}

function inferTermExpressionType(expression: TermExpression, environment: EnvironmentEntry[]): string | null {
  const elementType = environment.find((entry) => entry.type === "Type")?.name ??
    (environment.some((entry) => entry.type === "Nat" || entry.type === "List Nat") ? "Nat" : undefined);
  if (expression.kind === "atom") {
    const local = environment.find((entry) => entry.name === expression.value);
    if (local) return local.type;
    if (/^\d+$/.test(expression.value)) return "Nat";
    if (expression.value === "Nat.succ") return "Nat → Nat";
    if (expression.value === "Nat.add" || expression.value === "Nat.mul") return "Nat → Nat → Nat";
    if (expression.value === "sum") return "List Nat → Nat";
    if (expression.value === "repeatEach") return "Nat → List Nat → List Nat";
    if (expression.value === "List.length" && elementType) return `List ${elementType} → Nat`;
    if (expression.value === "List.reverse" && elementType) return `List ${elementType} → List ${elementType}`;
    if (expression.value === "List.replicate" && elementType) return `Nat → ${elementType} → List ${elementType}`;
    if (expression.value === "List.cons" && elementType) {
      return `${elementType} → List ${elementType} → List ${elementType}`;
    }
    if (expression.value === "[]" && elementType) return `List ${elementType}`;
    return null;
  }
  if (expression.kind === "add" || expression.kind === "mul") return "Nat";
  if (expression.kind === "append") {
    return inferTermExpressionType(expression.left, environment) ??
      inferTermExpressionType(expression.right, environment) ??
      (elementType ? `List ${elementType}` : null);
  }
  if (expression.kind === "cons") {
    return inferTermExpressionType(expression.right, environment) ??
      (elementType ? `List ${elementType}` : null);
  }
  if (expression.fn.kind === "atom" && expression.fn.value === "List.length") return "Nat";
  if (expression.fn.kind === "atom" && expression.fn.value === "sum") return "Nat";
  if (expression.fn.kind === "atom" && expression.fn.value === "Nat.succ") return "Nat";
  if (expression.fn.kind === "atom" && expression.fn.value === "List.reverse") {
    return inferTermExpressionType(expression.argument, environment);
  }
  const functionType = inferTermExpressionType(expression.fn, environment);
  const shape = functionType ? peelFunction(functionType, environment) : null;
  return shape?.codomain ?? null;
}

function termContains(
  expression: TermExpression,
  predicate: (node: TermExpression) => boolean,
): boolean {
  if (predicate(expression)) return true;
  if (expression.kind === "atom") return false;
  if (expression.kind === "application") {
    return termContains(expression.fn, predicate) || termContains(expression.argument, predicate);
  }
  return termContains(expression.left, predicate) || termContains(expression.right, predicate);
}

function termApplicationHead(expression: TermExpression) {
  let current = expression;
  while (current.kind === "application") current = current.fn;
  return current.kind === "atom" ? current.value : null;
}

function termApplicationSpine(expression: TermExpression) {
  const args: TermExpression[] = [];
  let current = expression;
  while (current.kind === "application") {
    args.unshift(current.argument);
    current = current.fn;
  }
  return current.kind === "atom" ? { head: current.value, args } : null;
}

function termApplication(head: string, ...args: TermExpression[]): TermExpression {
  return args.reduce<TermExpression>(
    (fn, argument) => ({ kind: "application", fn, argument }),
    { kind: "atom", value: head },
  );
}

function normalizeTermExpression(expression: TermExpression): TermExpression {
  if (expression.kind === "atom") return expression;
  if (expression.kind === "application") {
    const fn = normalizeTermExpression(expression.fn);
    const argument = normalizeTermExpression(expression.argument);
    if (fn.kind === "atom" && fn.value === "List.length") {
      if (argument.kind === "atom" && argument.value === "[]") {
        return { kind: "atom", value: "0" };
      }
      if (argument.kind === "cons") {
        return normalizeTermExpression({
          kind: "application",
          fn: { kind: "atom", value: "Nat.succ" },
          argument: {
            kind: "application",
            fn,
            argument: argument.right,
          },
        });
      }
    }
    const application = { kind: "application" as const, fn, argument };
    const spine = termApplicationSpine(application);
    if (spine?.head === "sum" && spine.args.length === 1) {
      const [list] = spine.args;
      if (list.kind === "atom" && list.value === "[]") return { kind: "atom", value: "0" };
      if (list.kind === "cons") {
        return normalizeTermExpression({
          kind: "add",
          left: list.left,
          right: termApplication("sum", list.right),
        });
      }
    }
    if (spine?.head === "List.reverse" && spine.args.length === 1 &&
        spine.args[0].kind === "atom" && spine.args[0].value === "[]") {
      return { kind: "atom", value: "[]" };
    }
    if (spine?.head === "List.replicate" && spine.args.length === 2) {
      const [count, value] = spine.args;
      if (count.kind === "atom" && count.value === "0") return { kind: "atom", value: "[]" };
      const successor = termApplicationSpine(count);
      if (successor?.head === "Nat.succ" && successor.args.length === 1) {
        return normalizeTermExpression({
          kind: "cons",
          left: value,
          right: termApplication("List.replicate", successor.args[0], value),
        });
      }
    }
    if (spine?.head === "repeatEach" && spine.args.length === 2) {
      const [count, list] = spine.args;
      if (list.kind === "atom" && list.value === "[]") return { kind: "atom", value: "[]" };
      if (list.kind === "cons") {
        return normalizeTermExpression({
          kind: "append",
          left: termApplication("List.replicate", count, list.left),
          right: termApplication("repeatEach", count, list.right),
        });
      }
    }
    return application;
  }

  const left = normalizeTermExpression(expression.left);
  const right = normalizeTermExpression(expression.right);
  if (expression.kind === "add") {
    if (right.kind === "atom" && right.value === "0") return left;
    if (right.kind === "application" && right.fn.kind === "atom" && right.fn.value === "Nat.succ") {
      return normalizeTermExpression({
        kind: "application",
        fn: right.fn,
        argument: { kind: "add", left, right: right.argument },
      });
    }
    return { kind: "add", left, right };
  }
  if (expression.kind === "mul") {
    if (right.kind === "atom" && right.value === "0") return { kind: "atom", value: "0" };
    const successor = termApplicationSpine(right);
    if (successor?.head === "Nat.succ" && successor.args.length === 1) {
      return normalizeTermExpression({
        kind: "add",
        left: { kind: "mul", left, right: successor.args[0] },
        right: left,
      });
    }
    return { kind: "mul", left, right };
  }
  if (expression.kind === "append") {
    if (left.kind === "atom" && left.value === "[]") return right;
    if (left.kind === "cons") {
      return normalizeTermExpression({
        kind: "cons",
        left: left.left,
        right: { kind: "append", left: left.right, right },
      });
    }
    return { kind: "append", left, right };
  }
  return { kind: "cons", left, right };
}

function normalizeTerm(value: string): string {
  const expression = parseTermExpression(value);
  return expression
    ? printTermExpression(normalizeTermExpression(restoreTermNotation(expression)))
    : stripTypeParens(value);
}

function normalizeTermsInType(type: string, environment: EnvironmentEntry[]): string {
  const parsed = parseType(type, environment);
  if (parsed.kind === "meta") return parsed.source;
  if (parsed.kind === "atom" || parsed.kind === "application") return normalizeTerm(parsed.source);
  if (parsed.kind === "equality") {
    return `${normalizeTerm(parsed.left.source)} = ${normalizeTerm(parsed.right.source)}`;
  }
  if (parsed.kind === "forall" || parsed.kind === "exists") {
    const quantifier = parsed.kind === "forall" ? "∀" : "∃";
    const binder = `${parsed.binder} : ${normalizeTermsInType(parsed.domain.source, environment)}`;
    const renderedBinder = parsed.implicit ? `{${binder}}` : binder;
    return `${quantifier} ${renderedBinder}, ${normalizeTermsInType(parsed.body.source, environment)}`;
  }
  if (parsed.kind === "lambda") {
    return `fun ${parsed.binder} => ${normalizeTermsInType(parsed.body.source, environment)}`;
  }
  if (parsed.kind === "negation") {
    const body = normalizeTermsInType(parsed.body.source, environment);
    return ["atom", "application", "negation"].includes(parseType(body, environment).kind)
      ? `¬${body}`
      : `¬(${body})`;
  }
  if (parsed.kind === "arrow") {
    const domain = normalizeTermsInType(parsed.domain.source, environment);
    const codomain = normalizeTermsInType(parsed.codomain.source, environment);
    const domainText = parseType(domain, environment).kind === "arrow" ? `(${domain})` : domain;
    return `${domainText} → ${codomain}`;
  }
  const operator = { and: "∧", or: "∨", iff: "↔" }[parsed.kind];
  const left = normalizeTermsInType(parsed.left.source, environment);
  const right = normalizeTermsInType(parsed.right.source, environment);
  return `${left} ${operator} ${right}`;
}

function normalForm(value: string) {
  return compact(normalizeTerm(value));
}

function definitionallyEqual(left: string, right: string) {
  if (typesEqual(left, right)) return true;
  const l = normalForm(left);
  const r = normalForm(right);
  return l === r;
}

function typesDefinitionallyEqual(left: string, right: string) {
  if (typesEqual(left, right)) return true;
  const leftEquality = parseEquality(left);
  const rightEquality = parseEquality(right);
  return Boolean(
    leftEquality && rightEquality &&
    definitionallyEqual(leftEquality.left, rightEquality.left) &&
    definitionallyEqual(leftEquality.right, rightEquality.right)
  );
}

function reflexiveArgument(body: string, target: string, binder: string) {
  const bodyEquality = parseEquality(body);
  const targetEquality = parseEquality(target);
  if (!bodyEquality || !targetEquality) return null;
  if (!typesEqual(bodyEquality.left, binder) || !typesEqual(bodyEquality.right, binder)) return null;
  if (!definitionallyEqual(targetEquality.left, targetEquality.right)) return null;

  const leftNormal = normalForm(targetEquality.left);
  const rightNormal = normalForm(targetEquality.right);
  return leftNormal === rightNormal ? normalizeTerm(targetEquality.left) : targetEquality.left;
}

function termChoice(
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
  candidate: TermCandidate,
): CatalogueMoveChoice {
  return {
    id: `term-${candidate.text}`,
    label: candidate.text,
    category: "term",
    apply: () => fillCandidate(state, hole, candidate),
  };
}

function normalizeNaturalNumber(value?: string) {
  if (!value || !/^\d+$/.test(value)) return null;
  return value.replace(/^0+(?=\d)/, "");
}

function naturalNumberChoice(
  state: ProofState,
  category: CatalogueMoveChoice["category"],
  applyNumber: (number: string) => ProofState,
  acceptsNumber: (number: string) => boolean = () => true,
): CatalogueMoveChoice {
  return {
    id: "term-natural-number",
    label: "natural number",
    category,
    input: "natural-number",
    acceptsInput: (value) => {
      const number = normalizeNaturalNumber(value);
      return number !== null && acceptsNumber(number);
    },
    apply: (value) => {
      const number = normalizeNaturalNumber(value);
      return number === null || !acceptsNumber(number) ? state : applyNumber(number);
    },
  };
}

function acceptsNaturalNumber(
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
) {
  if (hole.allowedTexts) return hole.allowedTexts.some((text) => /^\d+$/.test(text));
  return canUnify(state, "Nat", hole.expected, hole.environment) &&
    satisfiesPlaceholderConstraints(state, hole, "0");
}

function naturalNumberTermChoice(
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
  category: CatalogueMoveChoice["category"],
) {
  return naturalNumberChoice(
    state,
    category,
    (number) => fillCandidate(state, hole, { text: number, type: "Nat" }),
    (number) => !hole.allowedTexts || hole.allowedTexts.includes(number),
  );
}

function dependentApplicationMatch(
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
  candidate: TermCandidate,
) {
  if (!hole.applicationArgumentId || !hole.applicationTarget) return null;
  const candidateShape = peelFunction(candidate.type, hole.environment);
  const expectedShape = peelFunction(hole.expected, hole.environment);
  if (!candidateShape?.binder || !expectedShape) return null;
  const inferred = reflexiveArgument(
    candidateShape.codomain,
    hole.applicationTarget,
    candidateShape.binder,
  ) ?? matchDependentResult(
    candidateShape.codomain,
    hole.applicationTarget,
    candidateShape.binder,
  );
  if (!inferred) return null;
  const instantiatedResult = replaceToken(candidateShape.codomain, candidateShape.binder, inferred);
  if (!typesDefinitionallyEqual(instantiatedResult, hole.applicationTarget)) return null;
  const substitutions = unifyTypes(
    expectedShape.domain,
    candidateShape.domain,
    hole.environment,
    state.substitutions,
    state.metaTypes,
  );
  return substitutions ? { substitutions, inferred, domain: candidateShape.domain } : null;
}

function unresolvedDependentApplicationMatch(
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
  candidate: TermCandidate,
) {
  if (!hole.applicationArgumentId || !hole.applicationTarget) return null;
  const candidateShape = peelFunction(candidate.type, hole.environment);
  const expectedShape = peelFunction(hole.expected, hole.environment);
  if (!candidateShape?.binder || !expectedShape) return null;

  const placeholder = `?a${hole.applicationArgumentId}`;
  const instantiatedCodomain = replaceToken(
    candidateShape.codomain,
    candidateShape.binder,
    placeholder,
  );
  if (instantiatedCodomain === candidateShape.codomain) return null;

  const substitutions = unifyPairs(state, [
    [candidateShape.domain, expectedShape.domain],
    [instantiatedCodomain, expectedShape.codomain],
  ], hole.environment);
  return substitutions
    ? { substitutions, placeholder, domain: candidateShape.domain }
    : null;
}

function instantiateLeadingImplicits(state: ProofState, type: string, environment: EnvironmentEntry[]) {
  let nextState = state;
  let instantiatedType = type;
  for (;;) {
    const shape = peelFunction(instantiatedType, environment);
    if (!shape?.implicit || !shape.binder) break;
    const metaId = nextState.nextMetaId;
    const meta = `?u${metaId}`;
    nextState = {
      ...nextState,
      nextMetaId: metaId + 1,
      metaTypes: {
        ...nextState.metaTypes,
        [metaId]: resolveType(shape.domain, nextState.substitutions),
      },
    };
    instantiatedType = replaceToken(shape.codomain, shape.binder, meta);
  }
  return { state: nextState, type: instantiatedType };
}

function instantiateCandidateImplicits(state: ProofState, candidate: TermCandidate) {
  const instantiated = instantiateLeadingImplicits(state, candidate.type, []);
  return {
    state: instantiated.state,
    candidate: { ...candidate, type: instantiated.type },
  };
}

type SpineMatch = {
  state: ProofState;
  candidate: TermCandidate;
  arguments: { hole: ProofNode; expected: string; placeholder?: string; allowedTexts?: string[] }[];
  deferred: TypeConstraint[];
};

function matchCandidateApplicationSpine(
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
  candidate: TermCandidate,
): SpineMatch | null {
  const argumentNodes = applicationArgumentsFollowingHole(state.root, hole.id);
  if (!argumentNodes?.length) return null;
  const argumentHoles = argumentNodes.filter(
    (node): node is Extract<ProofNode, { kind: "hole" }> => node.kind === "hole",
  );
  if (argumentHoles.length !== argumentNodes.length) return null;

  const prepared = instantiateCandidateImplicits(state, candidate);
  let candidateState = prepared.state;
  let substitutions = prepared.state.substitutions;
  let candidateResult = prepared.candidate.type;
  let expectedResult = hole.expected;
  const matchedArguments: SpineMatch["arguments"] = [];
  const deferred: TypeConstraint[] = [];
  let termSubstitutions = candidateState.termSubstitutions;

  for (const argumentHole of argumentHoles) {
    const instantiated = instantiateLeadingImplicits(
      withSubstitutions(candidateState, substitutions),
      resolveType(candidateResult, substitutions),
      hole.environment,
    );
    candidateState = instantiated.state;
    candidateResult = instantiated.type;
    const candidateShape = peelFunction(resolveType(candidateResult, substitutions), hole.environment);
    const expectedShape = peelFunction(resolveType(expectedResult, substitutions), hole.environment);
    if (!candidateShape || candidateShape.implicit || !expectedShape) return null;

    const domainMatch = unifyTypeConstraints(
      candidateShape.domain,
      expectedShape.domain,
      hole.environment,
      substitutions,
      candidateState.metaTypes,
      true,
      termSubstitutions,
    );
    if (!domainMatch) return null;
    substitutions = domainMatch.substitutions;
    termSubstitutions = domainMatch.termSubstitutions;
    deferred.push(...domainMatch.deferred);

    const placeholder = candidateShape.binder ? `?a${argumentHole.id}` : undefined;
    let inferredArgument: string | undefined;
    if (placeholder && stripTypeParens(candidateShape.domain).startsWith("List.Perm ") &&
        parseType(expectedShape.domain, hole.environment).kind === "meta" &&
        replaceToken(candidateShape.codomain, candidateShape.binder!, placeholder) !== candidateShape.codomain) {
      const compatibleEnvironment = hole.environment.flatMap((entry) => {
        const match = unifyTypeConstraints(
          candidateShape.domain,
          entry.type,
          hole.environment,
          substitutions,
          candidateState.metaTypes,
          true,
          termSubstitutions,
        );
        return match ? [{ entry, match }] : [];
      });
      if (compatibleEnvironment.length === 1) {
        const inferred = compatibleEnvironment[0];
        substitutions = inferred.match.substitutions;
        termSubstitutions = { ...inferred.match.termSubstitutions, [placeholder]: inferred.entry.name };
        inferredArgument = inferred.entry.name;
      }
    }
    matchedArguments.push({
      hole: argumentHole,
      expected: resolveType(candidateShape.domain, substitutions),
      placeholder,
      allowedTexts: inferredArgument ? [inferredArgument] : undefined,
    });
    candidateResult = candidateShape.binder
      ? replaceToken(candidateShape.codomain, candidateShape.binder, placeholder!)
      : candidateShape.codomain;
    expectedResult = expectedShape.binder
      ? replaceToken(expectedShape.codomain, expectedShape.binder, placeholder ?? `?a${argumentHole.id}`)
      : expectedShape.codomain;
  }

  const instantiatedResult = instantiateLeadingImplicits(
    withSubstitutions(candidateState, substitutions),
    resolveType(candidateResult, substitutions),
    hole.environment,
  );
  candidateState = instantiatedResult.state;
  candidateResult = instantiatedResult.type;

  const resultMatch = unifyTypeConstraints(
    candidateResult,
    expectedResult,
    hole.environment,
    substitutions,
    candidateState.metaTypes,
    true,
    termSubstitutions,
  );
  if (!resultMatch) return null;
  substitutions = resultMatch.substitutions;
  termSubstitutions = resultMatch.termSubstitutions;
  deferred.push(...resultMatch.deferred);
  for (const argument of matchedArguments) {
    if (!argument.placeholder || !termSubstitutions[argument.placeholder]) continue;
    const inferredType = inferredTermType(
      resolveTermSubstitutions(termSubstitutions[argument.placeholder], termSubstitutions),
      hole.environment,
    );
    if (!inferredType) continue;
    const typeMatch = unifyTypeConstraints(
      argument.expected,
      inferredType,
      hole.environment,
      substitutions,
      candidateState.metaTypes,
      true,
      termSubstitutions,
    );
    if (!typeMatch) return null;
    substitutions = typeMatch.substitutions;
    termSubstitutions = typeMatch.termSubstitutions;
    deferred.push(...typeMatch.deferred);
  }
  const matchedState = withSubstitutions({ ...candidateState, termSubstitutions }, substitutions);
  const resolvedDeferred = deferred.map((constraint) => ({
    ...constraint,
    left: resolveTermSubstitutions(constraint.left, termSubstitutions),
    right: resolveTermSubstitutions(constraint.right, termSubstitutions),
  }));
  return {
    state: matchedState,
    candidate: {
      ...prepared.candidate,
      type: resolveType(prepared.candidate.type, substitutions),
    },
    arguments: matchedArguments.map((argument) => {
      const allowedTexts = argument.allowedTexts ?? (argument.placeholder && termSubstitutions[argument.placeholder]
        ? [termSubstitutions[argument.placeholder]]
        : undefined);
      return {
        ...argument,
        expected: resolveType(argument.expected, substitutions),
        allowedTexts,
        placeholder: allowedTexts ? undefined : argument.placeholder,
      };
    }),
    deferred: resolvedDeferred,
  };
}

function candidateFits(
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
  candidate: TermCandidate,
) {
  if (applicationArgumentsFollowingHole(state.root, hole.id)?.length) {
    return Boolean(matchCandidateApplicationSpine(state, hole, candidate));
  }
  const prepared = instantiateCandidateImplicits(state, candidate);
  return canUnify(prepared.state, prepared.candidate.type, hole.expected, hole.environment) ||
    Boolean(dependentApplicationMatch(prepared.state, hole, prepared.candidate));
}

function fillCandidate(
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
  candidate: TermCandidate,
) {
  const spine = matchCandidateApplicationSpine(state, hole, candidate);
  if (spine) {
    let root = spine.state.root;
    for (const argument of spine.arguments) {
      if (argument.hole.kind !== "hole") continue;
      root = updateHole(root, argument.hole.id, (argumentHole) => ({
        ...argumentHole,
        expected: argument.expected,
        termPlaceholder: argument.placeholder,
        allowedTexts: argument.allowedTexts,
      }));
    }
    const preparedState = {
      ...spine.state,
      root,
      constraints: [...spine.state.constraints, ...spine.deferred],
    };
    return fill(preparedState, hole.id, {
      kind: "term",
      text: spine.candidate.text,
      type: spine.candidate.type,
    }, spine.candidate.text);
  }

  const prepared = instantiateCandidateImplicits(state, candidate);
  const candidateState = prepared.state;
  candidate = prepared.candidate;
  const unresolvedDependent = unresolvedDependentApplicationMatch(candidateState, hole, candidate);
  if (unresolvedDependent && hole.applicationArgumentId) {
    let unified = withSubstitutions(candidateState, unresolvedDependent.substitutions);
    unified = {
      ...unified,
      root: updateHole(unified.root, hole.applicationArgumentId, (argumentHole) => ({
        ...argumentHole,
        expected: resolveType(unresolvedDependent.domain, unresolvedDependent.substitutions),
        termPlaceholder: unresolvedDependent.placeholder,
      })),
    };
    return fill(unified, hole.id, {
      kind: "term",
      text: candidate.text,
      type: resolveType(candidate.type, unresolvedDependent.substitutions),
    }, candidate.text);
  }

  const dependent = dependentApplicationMatch(candidateState, hole, candidate);
  if (dependent && hole.applicationArgumentId) {
    let unified = withSubstitutions(candidateState, dependent.substitutions);
    unified = {
      ...unified,
      root: updateHole(unified.root, hole.applicationArgumentId, (argumentHole) => ({
        ...argumentHole,
        expected: resolveType(dependent.domain, dependent.substitutions),
        allowedTexts: [dependent.inferred],
      })),
    };
    return fill(unified, hole.id, {
      kind: "term",
      text: candidate.text,
      type: candidate.type,
    }, candidate.text);
  }

  const substitutions = unifyTypes(
    candidate.type,
    hole.expected,
    hole.environment,
    candidateState.substitutions,
    candidateState.metaTypes,
  );
  if (!substitutions) return state;
  const unified = withSubstitutions(candidateState, substitutions);
  return fill(unified, hole.id, {
    kind: "term",
    text: candidate.text,
    type: resolveType(candidate.type, substitutions),
  }, candidate.text);
}

function simpleTermCandidates(
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
  unlocks: UnlockedMoves,
  includeDotTerms = false,
) {
  const constraintTerms = hole.termPlaceholder
    ? state.constraints.flatMap((constraint) => {
        const inferred = reflexiveArgument(
          constraint.left,
          constraint.right,
          hole.termPlaceholder!,
        ) ?? matchDependentResult(
          constraint.left,
          constraint.right,
          hole.termPlaceholder!,
        );
        return inferred ? [inferred] : [];
      })
    : [];
  const inferredTerms = [...new Set([...(hole.allowedTexts ?? []), ...constraintTerms])].flatMap((term) => {
    const text = normalizeTerm(term);
    const type = inferredTermType(text, hole.environment) ?? hole.expected;
    return [{ text, type }];
  });
  return [
    ...candidateTerms(state, hole.environment, unlocks, hole.expected),
    ...inferredTerms,
    ...(includeDotTerms ? dotTermCandidates(state, hole.environment, hole.expected, unlocks) : []),
  ].filter((candidate) =>
    !containsInternalMetavariable(candidate.text) &&
    candidateFits(state, hole, candidate) &&
    satisfiesPlaceholderConstraints(state, hole, candidate.text) &&
    (!hole.allowedTexts || hole.allowedTexts.some((term) =>
      normalForm(term) === normalForm(candidate.text)
    ))
  );
}

function satisfiesPlaceholderConstraints(
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
  term: string,
) {
  if (!hole.termPlaceholder) return true;
  let substitutions = state.substitutions;
  let termSubstitutions = state.termSubstitutions;
  for (const constraint of state.constraints) {
    const unified = unifyTypeConstraints(
      replacePlaceholder(constraint.left, hole.termPlaceholder, term),
      replacePlaceholder(constraint.right, hole.termPlaceholder, term),
      constraint.environment,
      substitutions,
      state.metaTypes,
      true,
      termSubstitutions,
    );
    if (!unified) return false;
    substitutions = unified.substitutions;
    termSubstitutions = unified.termSubstitutions;
  }
  return true;
}

function makeLambda(
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
  shape: FunctionShape,
  moveLabel?: string,
) {
  const name = binderName(shape, hole.environment);
  const bodyType = shape.binder ? replaceToken(shape.codomain, shape.binder, name) : shape.codomain;
  const child = newHole(state, bodyType, [...hole.environment, { name, type: shape.domain }]);
  const node: ProofNode = {
    kind: "template",
    type: hole.expected,
    format: `fun ${shape.implicit ? `{${name}}` : name} => {0}`,
    children: [child.hole],
    precedence: "lambda",
  };
  return fill(state, hole.id, node, moveLabel ?? `fun ${name} => □`, child.nextId);
}

function makeTemplate(
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
  label: string,
  format: string,
  childSpecs: { expected: string; environment?: EnvironmentEntry[]; allowedTexts?: string[] }[],
) {
  let nextId = state.nextId;
  const children: ProofNode[] = [];
  for (const spec of childSpecs) {
    children.push({
      kind: "hole",
      id: nextId,
      expected: spec.expected,
      environment: spec.environment ?? hole.environment,
      allowedTexts: spec.allowedTexts,
    });
    nextId += 1;
  }
  return fill(state, hole.id, {
    kind: "template",
    type: hole.expected,
    format,
    children,
    tacticBranches: children.length > 1,
  }, label, nextId);
}

function witnessCandidates(
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
  witnessType: string,
  unlocks: UnlockedMoves,
) {
  const values = candidateTerms(state, hole.environment, unlocks)
    .filter((candidate) => typesEqual(candidate.type, witnessType));
  return [...new Map(values.map((candidate) => [candidate.text, candidate])).values()];
}

function getNormalTermChoices(state: ProofState, unlocks: UnlockedMoves): CatalogueMoveChoice[] {
  const hole = activeHole(state);
  if (!hole) return [];
  const choices: CatalogueMoveChoice[] = [];
  const direct = hasMove(unlocks, "term.environment")
    ? simpleTermCandidates(state, hole, unlocks)
    : [];
  direct.forEach((candidate) => choices.push(termChoice(state, hole, candidate)));
  if (hasMove(unlocks, "term.naturalNumber") && acceptsNaturalNumber(state, hole)) {
    choices.push(naturalNumberTermChoice(state, hole, "term"));
  }
  if (hole.allowedTexts) return dedupe(choices);

  const shape = peelFunction(hole.expected, hole.environment);
  if (hasMove(unlocks, "term.lambda") && shape) {
    const name = binderName(shape, hole.environment);
    choices.push({
      id: "term-lambda",
      label: `fun ${name} => □`,
      category: "term",
      apply: () => makeLambda(state, hole, shape),
    });
  }

  const blocksDependentConstraint = Boolean(
    hole.termPlaceholder && state.constraints.some((constraint) =>
      `${constraint.left} ${constraint.right}`.includes(hole.termPlaceholder!)
    ),
  );

  if (hasMove(unlocks, "term.application") && !blocksDependentConstraint) {
    choices.push({
      id: "term-application",
      label: "(□ □)",
      category: "term",
      apply: () => {
        const meta = `?u${state.nextMetaId}`;
        const functionHole: ProofNode = {
          kind: "hole",
          id: state.nextId,
          expected: `${meta} → ${hole.expected}`,
          environment: hole.environment,
          applicationArgumentId: state.nextId + 1,
          applicationTarget: hole.expected,
        };
        const argumentHole: ProofNode = {
          kind: "hole",
          id: state.nextId + 1,
          expected: meta,
          environment: hole.environment,
        };
        const application: ProofNode = {
          kind: "template",
          type: hole.expected,
          format: "{0} {1}",
          children: [functionHole, argumentHole],
          precedence: "application",
          termPlaceholder: hole.termPlaceholder,
        };
        return advance(
          state,
          "(□ □)",
          replaceHole(state.root, hole.id, application),
          state.nextId + 2,
          undefined,
          state.nextMetaId + 1,
        );
      },
    });
  }

  if (!blocksDependentConstraint && dotOptions(state, hole.environment, hole.expected, unlocks).length) {
    choices.push({
      id: "term-dot-notation",
      label: "□.□",
      category: "term",
      apply: () => advance(state, "□.□", state.root, state.nextId, {
        kind: "dot-source", holeId: hole.id, target: hole.expected,
      }),
    });
  }

  return dedupe(choices);
}

function splitApplication(value: string) {
  const parsed = parseTermExpression(value);
  if (!parsed) return null;
  const expression = elaborateTermNotation(normalizeTermExpression(parsed));
  if (expression.kind !== "application") return null;
  return {
    fn: printElaboratedTerm(expression.fn),
    arg: printElaboratedTerm(expression.argument),
  };
}

function dedupe(choices: CatalogueMoveChoice[]) {
  const seen = new Set<string>();
  return choices.filter((choice) => {
    if (seen.has(choice.id)) return false;
    seen.add(choice.id);
    return true;
  });
}

function stageTacticArguments(
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
  choices: CatalogueMoveChoice[],
) {
  const staged: CatalogueMoveChoice[] = [];
  const groups = new Map<string, { id: string; spec: TacticArgumentSpec; types: Set<string> }>();
  for (const choice of choices) {
    const spec = choice.tacticArgument;
    if (!spec) {
      staged.push(choice);
      continue;
    }
    const group = groups.get(spec.key);
    if (group) group.types.add(spec.type);
    else groups.set(spec.key, { id: choice.id, spec, types: new Set([spec.type]) });
  }
  for (const [key, { id, spec, types }] of groups) {
    staged.push({
      id,
      label: spec.placeholderLabel,
      category: "tactic",
      apply: () => advance(state, spec.placeholderLabel, state.root, state.nextId, {
        kind: "tactic-argument",
        holeId: hole.id,
        key,
        argumentTypes: [...types],
      }),
    });
  }
  return dedupe(staged);
}

function addRecursorChoices(
  choices: CatalogueMoveChoice[],
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
) {
  for (const entry of hole.environment) {
    const permutation = stripTypeParens(entry.type).match(/^List\.Perm\s+(\S+)\s+(\S+)$/);
    if (permutation) {
      const [, source, target] = permutation;
      const withoutEvidence = hole.environment.filter((item) =>
        item.name !== entry.name && ![source, target].includes(item.name)
      );
      const x = freshName("x", withoutEvidence);
      const y = freshName("y", withoutEvidence);
      const l = freshName("l", withoutEvidence);
      const l1 = freshName("l1", withoutEvidence);
      const l2 = freshName("l2", [...withoutEvidence, { name: l1, type: "List Nat" }]);
      const l3 = freshName("l3", [...withoutEvidence, { name: l1, type: "List Nat" }, { name: l2, type: "List Nat" }]);
      const substituteEndpoints = (left: string, right: string) =>
        replaceToken(replaceToken(hole.expected, source, left), target, right);
      const nilGoal = substituteEndpoints("[]", "[]");
      const consHypothesis = `sum ${l1} = sum ${l2}`;
      const consGoal = substituteEndpoints(`(${x} :: ${l1})`, `(${x} :: ${l2})`);
      const swapGoal = substituteEndpoints(`(${y} :: ${x} :: ${l})`, `(${x} :: ${y} :: ${l})`);
      const transGoal = substituteEndpoints(l1, l3);
      const label = `induction ${entry.name}`;
      choices.push({ id: `tactic-perm-rec-${entry.name}`, label, category: "tactic", apply: () =>
        makeTemplate(state, hole, label,
          `List.Perm.rec {0} (fun ${x} h ih => {1}) (fun ${x} ${y} ${l} => {2}) (fun h1 h2 ih1 ih2 => {3}) ${entry.name}`,
          [
            { expected: nilGoal, environment: withoutEvidence },
            { expected: consGoal, environment: [
              ...withoutEvidence,
              { name: x, type: "Nat" }, { name: l1, type: "List Nat" }, { name: l2, type: "List Nat" },
              { name: "h", type: `List.Perm ${l1} ${l2}` }, { name: "ih", type: consHypothesis },
            ] },
            { expected: swapGoal, environment: [
              ...withoutEvidence,
              { name: x, type: "Nat" }, { name: y, type: "Nat" }, { name: l, type: "List Nat" },
            ] },
            { expected: transGoal, environment: [
              ...withoutEvidence,
              { name: l1, type: "List Nat" }, { name: l2, type: "List Nat" }, { name: l3, type: "List Nat" },
              { name: "h1", type: `List.Perm ${l1} ${l2}` }, { name: "h2", type: `List.Perm ${l2} ${l3}` },
              { name: "ih1", type: `sum ${l1} = sum ${l2}` }, { name: "ih2", type: `sum ${l2} = sum ${l3}` },
            ] },
          ]), tacticArgument: {
          key: "induction", placeholderLabel: "induction □", term: entry.name, type: entry.type,
        } });
      continue;
    }
    if (entry.type === "Nat") {
      const rest = hole.environment.filter((item) => item.name !== entry.name);
      const stepName = freshName(entry.name, rest);
      const base = replaceToken(hole.expected, entry.name, "0");
      const hypothesis = replaceToken(hole.expected, entry.name, stepName);
      const step = replaceToken(hole.expected, entry.name, `(Nat.succ ${stepName})`);
      const ih = freshName("ih", [...rest, { name: stepName, type: "Nat" }]);
      const label = `induction ${entry.name}`;
      choices.push({ id: `tactic-nat-rec-${entry.name}`, label, category: "tactic", apply: () =>
        makeTemplate(state, hole, label, `Nat.rec {0} (fun ${stepName} ${ih} => {1}) ${entry.name}`, [
          { expected: base, environment: rest },
          { expected: step, environment: [...rest, { name: stepName, type: "Nat" }, { name: ih, type: hypothesis }] },
        ]), tacticArgument: {
          key: "induction", placeholderLabel: "induction □", term: entry.name, type: entry.type,
        } });
    }
    if (entry.type.startsWith("List ") && state.moves.length >= 0) {
      const rest = hole.environment.filter((item) => item.name !== entry.name);
      const elementType = entry.type.slice(5).trim();
      const xs = freshName("xs", rest);
      const x = freshName("x", rest);
      const base = replaceToken(hole.expected, entry.name, "[]");
      const hypothesis = replaceToken(hole.expected, entry.name, xs);
      const step = replaceToken(hole.expected, entry.name, `(${x} :: ${xs})`);
      const ih = freshName("ih", [...rest, { name: x, type: elementType }, { name: xs, type: entry.type }]);
      const label = `induction ${entry.name}`;
      choices.push({ id: `tactic-list-rec-${entry.name}`, label, category: "tactic", apply: () =>
        makeTemplate(state, hole, label, `List.rec {0} (fun ${x} ${xs} ${ih} => {1}) ${entry.name}`, [
          { expected: base, environment: rest },
          { expected: step, environment: [...rest, { name: x, type: elementType }, { name: xs, type: entry.type }, { name: ih, type: hypothesis }] },
        ]), tacticArgument: {
          key: "induction", placeholderLabel: "induction □", term: entry.name, type: entry.type,
        } });
    }
  }
}

function contradictionTerm(environment: EnvironmentEntry[]) {
  const impossible = environment.find((entry) => entry.type === "False");
  if (impossible) return impossible.name;
  for (const negative of environment) {
    const shape = peelFunction(negative.type, environment);
    if (!shape || shape.codomain !== "False") continue;
    const positive = environment.find((entry) => typesEqual(entry.type, shape.domain));
    if (positive) return `${negative.name} ${positive.name}`;
  }
  return null;
}

type SubstitutionOption = {
  variable: EnvironmentEntry;
  equality: EnvironmentEntry;
  replacement: string;
  variableOnLeft: boolean;
};

function substitutionOptions(environment: EnvironmentEntry[]): SubstitutionOption[] {
  const options: SubstitutionOption[] = [];
  for (const variable of environment) {
    for (const equality of environment) {
      const equation = parseEquality(equality.type);
      if (!equation) continue;
      const leftIsVariable = stripTypeParens(equation.left) === variable.name;
      const rightIsVariable = stripTypeParens(equation.right) === variable.name;
      const replacement = leftIsVariable
        ? equation.right
        : rightIsVariable ? equation.left : null;
      if (!replacement || replaceToken(replacement, variable.name, "__subst_occurs") !== replacement) {
        continue;
      }
      options.push({ variable, equality, replacement, variableOnLeft: leftIsVariable });
      break;
    }
  }
  return options;
}

function tacticChoices(
  state: ProofState,
  unlocks: UnlockedMoves,
  stageArguments = true,
): CatalogueMoveChoice[] {
  const hole = activeHole(state);
  if (!hole) return [];
  const choices: CatalogueMoveChoice[] = [];
  const propositionGoal = isProposition(hole.expected, hole.environment);
  const canChooseNaturalNumber = hasMove(unlocks, "term.naturalNumber") &&
    acceptsNaturalNumber(state, hole);
  if (hasMove(unlocks, "tactic.exact") &&
      (simpleTermCandidates(state, hole, unlocks, true).length || canChooseNaturalNumber)) {
    choices.push({ id: "tactic-exact", label: "exact □", category: "tactic", apply: () =>
      advance(state, "exact □", state.root, state.nextId, { kind: "exact", holeId: hole.id }) });
  }

  const shape = peelFunction(hole.expected, hole.environment);
  if (hasMove(unlocks, "tactic.intro") && shape) {
    const name = binderName(shape, hole.environment);
    choices.push({ id: "tactic-intro", label: `intro ${name}`, category: "tactic", apply: () => makeLambda(state, hole, shape, `intro ${name}`) });
  }

  const applicable = hasMove(unlocks, "tactic.apply")
    ? applicableFunctions(state, hole.environment, hole.expected, unlocks, true)
    : [];
  if (applicable.length) {
    choices.push({ id: "tactic-apply", label: "apply □", category: "tactic", apply: () =>
      advance(state, "apply □", state.root, state.nextId, {
        kind: "apply",
        holeId: hole.id,
        target: hole.expected,
      }) });
  }

  const conjunction = parseBinary(hole.expected, "∧");
  const iff = parseBinary(hole.expected, "↔");
  if (hasMove(unlocks, "tactic.constructor") && (conjunction || iff)) {
    const parts = conjunction ?? iff!;
    const format = conjunction ? "And.intro {0} {1}" : "Iff.intro {0} {1}";
    choices.push({ id: "tactic-constructor", label: "constructor", category: "tactic", apply: () =>
      makeTemplate(state, hole, "constructor", format, [
        { expected: conjunction ? parts.left : `${parts.left} → ${parts.right}` },
        { expected: conjunction ? parts.right : `${parts.right} → ${parts.left}` },
      ]) });
  }

  const disjunction = parseBinary(hole.expected, "∨");
  if (hasMove(unlocks, "tactic.orSides") && disjunction) {
    choices.push({ id: "tactic-left", label: "left", category: "tactic", apply: () =>
      makeTemplate(state, hole, "left", "Or.inl {0}", [{ expected: disjunction.left }]) });
    choices.push({ id: "tactic-right", label: "right", category: "tactic", apply: () =>
      makeTemplate(state, hole, "right", "Or.inr {0}", [{ expected: disjunction.right }]) });
  }

  if (propositionGoal && hasMove(unlocks, "tactic.cases")) {
    for (const entry of hole.environment) {
      const alternatives = parseBinary(entry.type, "∨");
      if (!alternatives) continue;
      const leftName = freshName(propositionName(alternatives.left), hole.environment);
      const rightName = freshName(propositionName(alternatives.right), hole.environment);
      choices.push({ id: `tactic-cases-${entry.name}`, label: `cases ${entry.name}`, category: "tactic", apply: () =>
        makeTemplate(state, hole, `cases ${entry.name}`, `Or.elim ${entry.name} (fun ${leftName} => {0}) (fun ${rightName} => {1})`, [
          { expected: hole.expected, environment: [...hole.environment.filter((item) => item.name !== entry.name), { name: leftName, type: alternatives.left }] },
          { expected: hole.expected, environment: [...hole.environment.filter((item) => item.name !== entry.name), { name: rightName, type: alternatives.right }] },
        ]), tacticArgument: {
          key: "cases", placeholderLabel: "cases □", term: entry.name, type: entry.type,
        } });
    }
  }

  if (hasMove(unlocks, "tactic.exfalso") && hole.expected !== "False") {
    choices.push({ id: "tactic-exfalso", label: "exfalso", category: "tactic", apply: () =>
      makeTemplate(state, hole, "exfalso", "False.elim {0}", [{ expected: "False" }]) });
  }

  if (hasMove(unlocks, "tactic.contradiction")) {
    const contradiction = contradictionTerm(hole.environment);
    if (contradiction) choices.push({ id: "tactic-contradiction", label: "contradiction", category: "tactic", apply: () =>
      fill(state, hole.id, { kind: "term", text: `False.elim (${contradiction})`, type: hole.expected }, "contradiction") });
  }

  if (propositionGoal && hasMove(unlocks, "tactic.byContra") && hole.expected !== "False") {
    const name = freshName(propositionName(negate(hole.expected)), hole.environment);
    const environment = [...hole.environment, { name, type: negate(hole.expected) }];
    choices.push({ id: "tactic-by-contra", label: `by_contra ${name}`, category: "tactic", apply: () =>
      makeTemplate(state, hole, `by_contra ${name}`, `Classical.byContradiction (fun ${name} => {0})`, [
        { expected: "False", environment },
      ]) });
  }

  const equality = parseEquality(hole.expected);
  if (hasMove(unlocks, "tactic.rfl") && equality && definitionallyEqual(equality.left, equality.right)) {
    choices.push({ id: "tactic-rfl", label: "rfl", category: "tactic", apply: () =>
      fill(state, hole.id, { kind: "term", text: `Eq.refl ${equality.left}`, type: hole.expected }, "rfl") });
  }

  const existential = parseExists(hole.expected, hole.environment);
  if (hasMove(unlocks, "tactic.use") && existential) {
    choices.push({ id: "tactic-use", label: "use □", category: "tactic", apply: () =>
      advance(state, "use □", state.root, state.nextId, {
        kind: "witness", holeId: hole.id, witnessType: existential.witnessType,
        binder: existential.binder, body: existential.body,
      }) });
  }

  if (propositionGoal && hasMove(unlocks, "tactic.rcases")) {
    for (const entry of hole.environment) {
      const exists = parseExists(entry.type, hole.environment);
      if (!exists) continue;
      const witness = freshName(exists.binder, hole.environment);
      const evidence = freshName(`h${witness}`, hole.environment);
      const environment = [
        ...hole.environment.filter((item) => item.name !== entry.name),
        { name: witness, type: exists.witnessType },
        { name: evidence, type: replaceToken(exists.body, exists.binder, witness) },
      ];
      choices.push({ id: `tactic-rcases-${entry.name}`, label: `rcases ${entry.name} with ⟨${witness}, ${evidence}⟩`, category: "tactic", apply: () =>
        makeTemplate(state, hole, `rcases ${entry.name} with ⟨${witness}, ${evidence}⟩`, `Exists.elim ${entry.name} (fun ${witness} ${evidence} => {0})`, [
          { expected: hole.expected, environment },
        ]), tacticArgument: {
          key: "rcases", placeholderLabel: "rcases □", term: entry.name, type: entry.type,
          scriptArgument: `${entry.name} with ⟨${witness}, ${evidence}⟩`,
        } });
    }
  }

  if (equality && hasMove(unlocks, "tactic.symm")) {
    choices.push({ id: "tactic-symm", label: "symm", category: "tactic", apply: () =>
      makeTemplate(state, hole, "symm", "Eq.symm {0}", [{ expected: `${equality.right} = ${equality.left}` }]) });
  }
  if (equality && hasMove(unlocks, "tactic.trans")) {
    const middleType = inferredTermType(equality.left, hole.environment);
    for (const middle of candidateTerms(state, hole.environment, unlocks).filter((candidate) =>
      middleType && canUnify(state, candidate.type, middleType, hole.environment)
    )) {
      if ([equality.left, equality.right].some((side) => compact(side) === compact(middle.text))) continue;
      choices.push({ id: `tactic-trans-${middle.text}`, label: `trans ${middle.text}`, category: "tactic", apply: () =>
        makeTemplate(state, hole, `trans ${middle.text}`, "Eq.trans {0} {1}", [
          { expected: `${equality.left} = ${middle.text}` }, { expected: `${middle.text} = ${equality.right}` },
        ]), tacticArgument: {
          key: "trans", placeholderLabel: "trans □", term: middle.text, type: middleType!,
        } });
    }
  }
  if (equality && hasMove(unlocks, "tactic.congr")) {
    const leftApp = splitApplication(equality.left);
    const rightApp = splitApplication(equality.right);
    if (leftApp && rightApp && leftApp.fn === rightApp.fn) {
      choices.push({ id: "tactic-congr", label: "congr", category: "tactic", apply: () =>
        makeTemplate(state, hole, "congr", `congrArg ${leftApp.fn} {0}`, [{ expected: `${leftApp.arg} = ${rightApp.arg}` }]) });
    }
  }

  if (hasMove(unlocks, "tactic.subst")) {
    for (const option of substitutionOptions(hole.environment)) {
      const { variable, equality: evidence, replacement, variableOnLeft } = option;
      const rewritten = rewriteSyntax(hole.expected, variable.name, replacement, true);
      const environment = hole.environment
        .filter((item) => item.name !== variable.name && item.name !== evidence.name)
        .map((item) => ({
          ...item,
          type: rewriteSyntax(item.type, variable.name, replacement, true),
        }));
      const equalityTerm = variableOnLeft ? `(Eq.symm ${evidence.name})` : evidence.name;
      choices.push({ id: `tactic-subst-${variable.name}`, label: `subst ${variable.name}`, category: "tactic", apply: () =>
        makeTemplate(state, hole, `subst ${variable.name}`, `Eq.ndrec {0} ${equalityTerm}`, [{ expected: rewritten, environment }]),
        tacticArgument: {
          key: "subst", placeholderLabel: "subst □", term: variable.name, type: variable.type,
        } });
    }
  }

  if (hasMove(unlocks, "tactic.rewrite")) addRewriteChoices(choices, state, hole, unlocks);

  if (propositionGoal && hasMove(unlocks, "tactic.byCases")) {
    for (const proposition of hole.environment.filter((entry) => entry.type === "Prop")) {
      const positive = freshName(`h${proposition.name}`, hole.environment);
      const negative = freshName(`hn${proposition.name}`, hole.environment);
      choices.push({ id: `tactic-by-cases-${proposition.name}`, label: `by_cases ${positive} : ${proposition.name}`, category: "tactic", apply: () =>
        makeTemplate(state, hole, `by_cases ${positive} : ${proposition.name}`, `Or.elim (Classical.em ${proposition.name}) (fun ${positive} => {0}) (fun ${negative} => {1})`, [
          { expected: hole.expected, environment: [...hole.environment, { name: positive, type: proposition.name }] },
          { expected: hole.expected, environment: [...hole.environment, { name: negative, type: negate(proposition.name) }] },
        ]), tacticArgument: {
          key: "by-cases", placeholderLabel: "by_cases □", term: proposition.name,
          type: "Prop", scriptArgument: `${positive} : ${proposition.name}`,
        } });
    }
  }

  if (hasMove(unlocks, "tactic.induction")) addRecursorChoices(choices, state, hole);

  const simplifiedEquality = equality ? simplifyWithoutFacts(equality) : null;
  if (hasMove(unlocks, "tactic.simp") && simplifiedEquality) {
    choices.push({ id: "tactic-simp", label: "simp", category: "tactic", apply: () => {
      if (simplifiedEquality.closed) {
        return fill(state, hole.id, { kind: "term", text: "by rfl", type: hole.expected }, "simp");
      }
      return makeTemplate(
        state,
        hole,
        "simp",
        `by change ${simplifiedEquality.target}; exact {0}`,
        [{ expected: simplifiedEquality.target }],
      );
    } });
  }

  if (hasMove(unlocks, "tactic.simpa") && directLibraryTerms(hole.expected, unlocks).length) {
    const proof = directLibraryTerms(hole.expected, unlocks)[0];
    choices.push({ id: "tactic-simpa", label: `simpa using ${proof.text}`, category: "tactic", apply: () =>
      fill(state, hole.id, { kind: "term", text: proof.text, type: hole.expected }, `simpa using ${proof.text}`),
      tacticArgument: {
        key: "simpa-using", placeholderLabel: "simpa using □", term: proof.text, type: proof.type,
      } });
  }

  if (hasMove(unlocks, "tactic.calc") && equality) {
    const resultType = inferredTermType(equality.left, hole.environment);
    const leftApplication = splitApplication(equality.left);
    const argumentType = leftApplication
      ? inferredTermType(leftApplication.arg, hole.environment)
      : resultType;
    for (const middle of candidateTerms(state, hole.environment, unlocks).filter((candidate) => !["Prop", "Type"].includes(candidate.type))) {
      if (!argumentType || !canUnify(state, middle.type, argumentType, hole.environment)) continue;
      const appliedMiddle = leftApplication?.fn
        ? `${leftApplication.fn} ${middle.text}`
        : middle.text;
      const appliedType = inferredTermType(appliedMiddle, hole.environment);
      if (!resultType || !appliedType || !canUnify(state, appliedType, resultType, hole.environment)) continue;
      if ([equality.left, equality.right].some((side) => typesEqual(side, appliedMiddle))) continue;
      choices.push({ id: `tactic-calc-${middle.text}`, label: `calc … = ${appliedMiddle} := □`, category: "tactic", apply: () =>
        makeTemplate(state, hole, `calc … = ${appliedMiddle} := □`, "Eq.trans {0} {1}", [
          { expected: `${equality.left} = ${appliedMiddle}` }, { expected: `${appliedMiddle} = ${equality.right}` },
        ]), scriptLayout: {
          kind: "calc", left: equality.left, middle: appliedMiddle, right: equality.right,
        }, tacticArgument: {
          key: "calc-middle", placeholderLabel: "calc … = □ := □", term: appliedMiddle,
          type: resultType,
        } });
    }
  }

  const unique = dedupe(choices);
  return stageArguments ? stageTacticArguments(state, hole, unique) : unique;
}

function addRewriteChoices(
  choices: CatalogueMoveChoice[],
  state: ProofState,
  hole: Extract<ProofNode, { kind: "hole" }>,
  unlocks: UnlockedMoves,
) {
  const sources = candidateTerms(state, hole.environment, unlocks, hole.expected);
  for (const entry of sources) {
    let relationType = entry.type;
    const binders: string[] = [];
    for (;;) {
      const shape = peelFunction(relationType, hole.environment);
      if (!shape?.binder) break;
      binders.push(shape.binder);
      relationType = shape.codomain;
    }
    const relation = parseEquality(relationType) ?? parseBinary(relationType, "↔");
    if (!relation) continue;
    const rewrite = (from: string, to: string) => {
      if (!binders.length) return rewriteSyntax(hole.expected, from, to);
      const goal = parseEquality(hole.expected);
      if (!goal) return hole.expected;
      const left = rewriteTermPattern(goal.left, from, to, binders);
      if (left !== goal.left) return `${left} = ${goal.right}`;
      const right = rewriteTermPattern(goal.right, from, to, binders);
      return right === goal.right ? hole.expected : `${goal.left} = ${right}`;
    };
    const forward = rewrite(relation.left, relation.right);
    if (forward !== hole.expected) {
      choices.push({ id: `tactic-rw-${entry.text}`, label: `rw [${entry.text}]`, category: "tactic", apply: () =>
        makeTemplate(state, hole, `rw [${entry.text}]`, `by rw [${entry.text}]; exact {0}`, [{ expected: forward }]),
        tacticArgument: {
          key: "rewrite-forward", placeholderLabel: "rw [□]", term: entry.text, type: entry.type,
        } });
    }
    const backward = rewrite(relation.right, relation.left);
    if (backward !== hole.expected) {
      choices.push({ id: `tactic-rw-back-${entry.text}`, label: `rw [← ${entry.text}]`, category: "tactic", apply: () =>
        makeTemplate(state, hole, `rw [← ${entry.text}]`, `by rw [← ${entry.text}]; exact {0}`, [{ expected: backward }]),
        tacticArgument: {
          key: "rewrite-backward", placeholderLabel: "rw [← □]", term: entry.text, type: entry.type,
        } });
    }
  }
}

function rewriteTermPattern(value: string, left: string, right: string, binders: string[]) {
  const valueExpression = parseTermExpression(value);
  const pattern = parseTermExpression(left);
  if (!valueExpression || !pattern) return value;
  const binderSet = new Set(binders);

  const match = (
    expected: TermExpression,
    actual: TermExpression,
    substitutions: Map<string, TermExpression>,
  ): boolean => {
    if (expected.kind === "atom" && binderSet.has(expected.value)) {
      const previous = substitutions.get(expected.value);
      if (!previous) {
        substitutions.set(expected.value, actual);
        return true;
      }
      return printTermExpression(previous) === printTermExpression(actual);
    }
    if (expected.kind !== actual.kind) return false;
    if (expected.kind === "atom" && actual.kind === "atom") return expected.value === actual.value;
    if (expected.kind === "application" && actual.kind === "application") {
      return match(expected.fn, actual.fn, substitutions) &&
        match(expected.argument, actual.argument, substitutions);
    }
    if (expected.kind !== "atom" && expected.kind !== "application" &&
        actual.kind !== "atom" && actual.kind !== "application") {
      return match(expected.left, actual.left, substitutions) &&
        match(expected.right, actual.right, substitutions);
    }
    return false;
  };

  const rewrite = (expression: TermExpression): { expression: TermExpression; changed: boolean } => {
    const substitutions = new Map<string, TermExpression>();
    if (match(pattern, expression, substitutions)) {
      let replacement = right;
      const replacements = [...substitutions].map(([binder, term], index) => ({
        binder,
        term,
        placeholder: `__leanquest_rewrite_${index}__`,
      }));
      for (const item of replacements) {
        replacement = replaceToken(replacement, item.binder, item.placeholder);
      }
      for (const item of replacements) {
        replacement = replaceToken(replacement, item.placeholder, `(${printTermExpression(item.term)})`);
      }
      const parsed = parseTermExpression(replacement);
      if (parsed) return { expression: parsed, changed: true };
    }
    if (expression.kind === "atom") return { expression, changed: false };
    if (expression.kind === "application") {
      const fn = rewrite(expression.fn);
      if (fn.changed) return { expression: { ...expression, fn: fn.expression }, changed: true };
      const argument = rewrite(expression.argument);
      return argument.changed
        ? { expression: { ...expression, argument: argument.expression }, changed: true }
        : { expression, changed: false };
    }
    const leftResult = rewrite(expression.left);
    if (leftResult.changed) return { expression: { ...expression, left: leftResult.expression }, changed: true };
    const rightResult = rewrite(expression.right);
    return rightResult.changed
      ? { expression: { ...expression, right: rightResult.expression }, changed: true }
      : { expression, changed: false };
  };

  const rewritten = rewrite(valueExpression);
  return rewritten.changed ? printTermExpression(rewritten.expression) : value;
}

function simplifyWithoutFacts(equality: { left: string; right: string }) {
  const left = normalizeTerm(equality.left);
  const right = normalizeTerm(equality.right);
  const closed = typesEqual(left, right);
  if (!closed && typesEqual(left, equality.left) && typesEqual(right, equality.right)) return null;
  return { closed, target: `${left} = ${right}` };
}

function pendingChoices(state: ProofState, unlocks: UnlockedMoves): CatalogueMoveChoice[] {
  const pending = state.pending!;
  const hole = holes(state.root).find((item) => item.id === pending.holeId);
  if (!hole) return [];

  if (pending.kind === "dot-source") {
    return dotOptions(state, hole.environment, pending.target, unlocks).map(({ source }) => ({
      id: `dot-source-${source.text}`,
      label: source.text,
      category: "argument" as const,
      apply: () => advance(state, source.text, state.root, state.nextId, {
        kind: "dot-function", holeId: hole.id, target: pending.target, source,
      }),
    }));
  }

  if (pending.kind === "dot-function") {
    const option = dotOptions(state, hole.environment, pending.target, unlocks).find(({ source }) =>
      source.text === pending.source.text && typesEqual(source.type, pending.source.type)
    );
    return (option?.functions ?? []).map(({ candidate, candidateState, name, shape, substitutions }) => ({
      id: `dot-function-${candidate.text}`,
      label: name,
      category: "argument" as const,
      apply: () => {
        const unified = withSubstitutions({ ...candidateState, pending: state.pending }, substitutions);
        return fill(unified, hole.id, {
          kind: "term",
          text: `${pending.source.text}.${name}`,
          type: resolveType(shape.codomain, substitutions),
        }, name);
      },
    }));
  }

  if (pending.kind === "tactic-argument") {
    const base = { ...state, pending: undefined };
    return tacticChoices(base, unlocks, false).flatMap((choice) => {
      const spec = choice.tacticArgument;
      if (!spec || spec.key !== pending.key) return [];
      return [{
        id: `tactic-argument-${pending.key}-${spec.term}`,
        label: spec.term,
        category: "argument" as const,
        argumentType: spec.type,
        scriptReplacement: spec.scriptArgument ?? spec.term,
        scriptLayout: choice.scriptLayout,
        apply: () => {
          const next = choice.apply();
          return { ...next, moves: [...state.moves, spec.term] };
        },
      }];
    });
  }

  if (pending.kind === "exact") {
    const base = { ...state, pending: undefined };
    const direct = simpleTermCandidates(base, hole, unlocks, true);
    const choices: CatalogueMoveChoice[] = direct.map((candidate) => ({
      ...termChoice(base, hole, candidate),
      argumentType: hole.expected,
    }));
    if (hasMove(unlocks, "term.naturalNumber") && acceptsNaturalNumber(base, hole)) {
      choices.push(naturalNumberTermChoice(base, hole, "argument"));
    }
    return dedupe(choices).map((choice) => ({
      ...choice,
      category: "argument",
      argumentType: choice.argumentType ?? hole.expected,
    }));
  }

  if (pending.kind === "witness") {
    const fillWitness = (candidate: TermCandidate) => {
      const expected = replaceToken(pending.body, pending.binder, candidate.text);
      const child = { kind: "hole" as const, id: state.nextId, expected, environment: hole.environment };
      const node: ProofNode = {
        kind: "template", type: hole.expected,
        format: `Exists.intro ${candidate.text} {0}`, children: [child],
        termPlaceholder: hole.termPlaceholder,
      };
      return advance(state, candidate.text, replaceHole(state.root, hole.id, node), state.nextId + 1);
    };
    const choices: CatalogueMoveChoice[] = witnessCandidates(state, hole, pending.witnessType, unlocks).map((candidate) => ({
      id: `witness-${candidate.text}`,
      label: candidate.text,
      category: "argument" as const,
      argumentType: pending.witnessType,
      apply: () => fillWitness(candidate),
    }));
    if (hasMove(unlocks, "term.naturalNumber") &&
        canUnify(state, "Nat", pending.witnessType, hole.environment)) {
      choices.push(naturalNumberChoice(state, "argument", (number) =>
        fillWitness({ text: number, type: "Nat" })
      ));
    }
    return dedupe(choices).map((choice) => ({
      ...choice,
      argumentType: choice.argumentType ?? pending.witnessType,
    }));
  }

  const allPremises = pending.kind === "apply";
  return applicableFunctions(state, hole.environment, pending.target, unlocks, allPremises).map((candidate) => ({
    id: `function-${candidate.text}`,
    label: candidate.text,
    category: "argument" as const,
    argumentType: resolveType(candidate.type, candidate.substitutions),
    apply: () => {
      const candidateState = withSubstitutions(
        { ...candidate.candidateState, pending: state.pending },
        candidate.substitutions,
      );
      let nextId = candidateState.nextId;
      const children: ProofNode[] = candidate.domains.map((domain) => {
        const id = nextId++;
        return domain.inferredText
          ? { kind: "term", text: domain.inferredText, type: domain.type }
          : {
              kind: "hole", id, expected: domain.type, environment: hole.environment,
              termPlaceholder: domain.termPlaceholder,
            };
      });
      const format = candidate.domains.reduce(
        (text, domain, index) =>
          domain.inferredText ? `(${text} ({${index}}))` : `(${text} {${index}})`,
        candidate.text,
      );
      const branchCount = children.filter((child) => child.kind === "hole").length;
      const node: ProofNode = {
        kind: "template",
        type: hole.expected,
        format,
        children,
        termPlaceholder: hole.termPlaceholder,
        tacticBranches: branchCount > 1,
      };
      return advance(
        candidateState,
        candidate.text,
        replaceHole(candidateState.root, hole.id, node),
        nextId,
      );
    },
  }));
}

export function getMoveChoices(state: ProofState, hero: HeroClass, level: number): MoveChoice[] {
  const unlocks = unlockedMoves(level, hero);
  const choices = state.pending
    ? pendingChoices(state, unlocks)
    : hero === "champion" ? getNormalTermChoices(state, unlocks) : tacticChoices(state, unlocks);
  return choices.map((choice) => ({
    ...choice,
    manaCost: choice.category === "tactic" ? tacticManaCost(choice.id) : 0,
    apply: (value?: string) => {
      const focusedHole = activeHole(state);
      const branchPath = focusedHole ? tacticBranchPath(state.root, focusedHole.id) ?? [] : [];
      const next = choice.apply(value);
      if (hero !== "apprentice") return next;
      if (choice.category === "tactic") {
        return {
          ...next,
          tacticScript: [...state.tacticScript, next.moves.at(-1) ?? choice.label],
          tacticBranchPaths: [...state.tacticBranchPaths, branchPath],
          tacticScriptLayouts: [...state.tacticScriptLayouts, choice.scriptLayout ?? null],
        };
      }
      const replacement = choice.scriptReplacement ?? next.moves.at(-1) ?? choice.label;
      const lineIndex = state.tacticScript.findLastIndex((line) => line.includes("□"));
      if (lineIndex < 0) return next;
      return {
        ...next,
        tacticScript: state.tacticScript.map((line, index) =>
          index === lineIndex ? line.replace("□", replacement) : line
        ),
        tacticScriptLayouts: state.tacticScriptLayouts.map((layout, index) =>
          index === lineIndex ? choice.scriptLayout ?? layout : layout
        ),
      };
    },
  }));
}

export function currentModeLabel(state: ProofState, hero: HeroClass) {
  if (state.pending?.kind === "apply") return "CHOOSE A FUNCTION";
  if (state.pending?.kind === "dot-source") return "CHOOSE A VALUE";
  if (state.pending?.kind === "dot-function") return "CHOOSE A FUNCTION";
  if (state.pending?.kind === "witness") return "CHOOSE A WITNESS";
  if (state.pending?.kind === "exact") return "CHOOSE A TERM";
  if (state.pending?.kind === "tactic-argument") return "CHOOSE A TERM";
  return hero === "champion" ? "CHOOSE A MOVE" : "CHOOSE A TACTIC";
}

export function pendingArgumentType(state: ProofState) {
  const pending = state.pending;
  if (!pending || pending.kind === "dot-source" || pending.kind === "dot-function") return null;
  const hole = holes(state.root).find((item) => item.id === pending.holeId);
  if (!hole) return null;
  const types = pending.kind === "exact"
    ? [hole.expected]
    : pending.kind === "witness"
      ? [pending.witnessType]
      : pending.kind === "apply"
        ? [`?₁ → … → ?ₙ → ${pending.target}`]
        : pending.argumentTypes;
  return [...new Set(types.map((type) => displayType(type, state.substitutions)))].join(" or ");
}

export function environmentLines(state: ProofState) {
  return activeHole(state)?.environment.map((entry) =>
    `${entry.name} : ${displayType(entry.type, state.substitutions)}`
  ) ?? [];
}

function displayType(type: string, substitutions: Record<number, string>) {
  return resolveType(type, substitutions).replace(/\?u(\d+)/g, "?$1");
}

export function currentTarget(state: ProofState) {
  const hole = activeHole(state);
  const target = hole?.expected;
  const displayed = target ? displayType(target, state.substitutions) : "No goals";
  return hole?.applicationArgumentId ? `(${displayed})` : displayed;
}

export function normalizeFocusedHole(state: ProofState): ProofState {
  const hole = activeHole(state);
  if (!hole) return state;
  const resolved = resolveType(hole.expected, state.substitutions);
  const normalized = normalizeTermsInType(resolved, hole.environment);
  if (typesEqual(resolved, normalized)) return state;
  return {
    ...state,
    root: updateHole(state.root, hole.id, (current) => ({ ...current, expected: normalized })),
  };
}
