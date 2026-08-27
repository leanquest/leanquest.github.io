import type { MoveId } from "./curriculum.ts";

export type CandidateTerm = { text: string; type: string };
export type CandidateContextEntry = { name: string; type: string };

export type CandidateRequest = {
  context: CandidateContextEntry[];
  unlocks: ReadonlySet<MoveId>;
  includeCatalogue: boolean;
  libraryTermTypes: Record<string, string>;
};

export type CandidateProvider = (request: CandidateRequest) => CandidateTerm[];

const catalogueTermNames: Partial<Record<MoveId, string[]>> = {
  "catalogue.trueIntro": ["True.intro"],
  "catalogue.andIntro": ["And.intro"],
  "catalogue.andLeft": ["And.left"],
  "catalogue.andRight": ["And.right"],
  "catalogue.orIntro": ["Or.inl", "Or.inr"],
  "catalogue.orElim": ["Or.elim"],
  "catalogue.falseElim": ["False.elim"],
  "catalogue.iffIntro": ["Iff.intro"],
  "catalogue.iffProjection": ["Iff.mp", "Iff.mpr"],
  "catalogue.byContradiction": ["Classical.byContradiction"],
  "catalogue.eqRefl": ["Eq.refl"],
  "catalogue.existsIntro": ["Exists.intro"],
  "catalogue.existsElim": ["Exists.elim"],
  "catalogue.eqSymm": ["Eq.symm"],
  "catalogue.eqTrans": ["Eq.trans"],
  "catalogue.congrArg": ["congrArg"],
  "catalogue.eqMp": ["Eq.mp"],
  "catalogue.classicalEm": ["Classical.em"],
  "catalogue.recursor": ["Nat.rec", "List.rec"],
  "catalogue.dataConstructors": ["Nat.succ", "List.cons"],
  "catalogue.natAddZero": ["Nat.add_zero"],
  "catalogue.natZeroAdd": ["Nat.zero_add"],
  "catalogue.natAddSucc": ["Nat.add_succ"],
  "catalogue.natSuccAdd": ["Nat.succ_add"],
  "catalogue.natAddAssoc": ["Nat.add_assoc"],
  "catalogue.natAddComm": ["Nat.add_comm"],
  "catalogue.listAppendNil": ["List.append_nil"],
  "catalogue.listAppendAssoc": ["List.append_assoc"],
  "catalogue.listLengthAppend": ["List.length_append"],
  "catalogue.sum": ["sum"],
  "catalogue.sumAppend": ["sum_append"],
  "catalogue.natAddLemmas": ["Nat.add", "Nat.zero_add", "Nat.add_assoc"],
  "catalogue.listPermRec": ["List.Perm.rec"],
  "catalogue.natAddLeftComm": ["Nat.add_left_comm"],
  "catalogue.listReplicate": ["List.replicate", "Nat.mul", "Nat.zero_mul", "Nat.succ_mul"],
  "catalogue.sumReplicate": ["sum_replicate"],
  "catalogue.repeatEach": ["repeatEach", "Nat.mul_add"],
};

export const contextCandidateProvider: CandidateProvider = ({ context }) =>
  context.map((entry) => ({ text: entry.name, type: entry.type }));

export const catalogueCandidateProvider: CandidateProvider = ({
  unlocks,
  includeCatalogue,
  libraryTermTypes,
}) => {
  if (!includeCatalogue) return [];
  const candidates: CandidateTerm[] = [];
  if (unlocks.has("term.emptyList")) candidates.push({ text: "[]", type: "List Nat" });
  if (unlocks.has("term.basicPropositions")) {
    candidates.push({ text: "True", type: "Prop" }, { text: "False", type: "Prop" });
  }
  for (const move of unlocks) {
    for (const name of catalogueTermNames[move] ?? []) {
      const type = libraryTermTypes[name];
      if (type) candidates.push({ text: name, type });
    }
  }
  return candidates;
};

export function collectCandidateTerms(
  request: CandidateRequest,
  providers: CandidateProvider[] = [contextCandidateProvider, catalogueCandidateProvider],
) {
  const candidates = providers.flatMap((provider) => provider(request));
  return [...new Map(candidates.map((candidate) => [
    `${candidate.text}:${candidate.type}`,
    candidate,
  ])).values()];
}

export type ProjectionFunctionShape = { domain: string; codomain: string };

export type ProjectionCandidate<State> = {
  source: CandidateTerm;
  projection: CandidateTerm;
  name: string;
  text: string;
  type: string;
  state: State;
};

export type ProjectionCandidateRequest<State, Substitutions> = {
  state: State;
  context: CandidateContextEntry[];
  sources: CandidateTerm[];
  functions: CandidateTerm[];
  prepareFunction: (state: State, candidate: CandidateTerm) => { state: State; candidate: CandidateTerm };
  firstExplicitShape: (type: string, context: CandidateContextEntry[]) => ProjectionFunctionShape | null;
  unifyDomain: (
    state: State,
    domain: string,
    sourceType: string,
    context: CandidateContextEntry[],
  ) => Substitutions | null;
  applySubstitutions: (state: State, substitutions: Substitutions) => State;
  resolveType: (type: string, substitutions: Substitutions) => string;
};

export function projectionCandidateProvider<State, Substitutions>({
  state,
  context,
  sources,
  functions,
  prepareFunction,
  firstExplicitShape,
  unifyDomain,
  applySubstitutions,
  resolveType,
}: ProjectionCandidateRequest<State, Substitutions>): ProjectionCandidate<State>[] {
  const projections = functions.filter((candidate) => candidate.text.includes("."));
  return sources.flatMap((source) => projections.flatMap((projection) => {
    const prepared = prepareFunction(state, projection);
    const shape = firstExplicitShape(prepared.candidate.type, context);
    if (!shape) return [];
    const substitutions = unifyDomain(prepared.state, shape.domain, source.type, context);
    if (!substitutions) return [];
    const name = projection.text.split(".").at(-1)!;
    return [{
      source,
      projection: prepared.candidate,
      name,
      text: `${source.text}.${name}`,
      type: resolveType(shape.codomain, substitutions),
      state: applySubstitutions(prepared.state, substitutions),
    }];
  }));
}
