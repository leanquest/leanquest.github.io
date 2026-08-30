import { basicPropositionTerms, type MoveId } from "./curriculum.ts";

export type CandidateTerm = { text: string; type: string };
export type CandidateEnvironmentEntry = { name: string; type: string };

export type CandidateRequest = {
  environment: CandidateEnvironmentEntry[];
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
  "catalogue.natAdd": ["Nat.add"],
  "catalogue.listPermRec": ["List.Perm.rec"],
  "catalogue.natAddLeftComm": ["Nat.add_left_comm"],
  "catalogue.listReplicate": ["List.replicate", "Nat.mul", "Nat.zero_mul", "Nat.succ_mul"],
  "catalogue.sumReplicate": ["sum_replicate"],
  "catalogue.repeatEach": ["repeatEach", "Nat.mul_add"],
};

export const environmentCandidateProvider: CandidateProvider = ({ environment }) =>
  environment.map((entry) => ({ text: entry.name, type: entry.type }));

export const catalogueCandidateProvider: CandidateProvider = ({
  unlocks,
  includeCatalogue,
  libraryTermTypes,
}) => {
  if (!includeCatalogue) return [];
  const candidates: CandidateTerm[] = [];
  if (unlocks.has("term.emptyList")) candidates.push({ text: "[]", type: "List Nat" });
  if (unlocks.has("term.basicPropositions")) {
    candidates.push(...basicPropositionTerms.map(({ name, type }) => ({ text: name, type })));
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
  providers: CandidateProvider[] = [environmentCandidateProvider, catalogueCandidateProvider],
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
  environment: CandidateEnvironmentEntry[];
  sources: CandidateTerm[];
  functions: CandidateTerm[];
  prepareFunction: (state: State, candidate: CandidateTerm) => { state: State; candidate: CandidateTerm };
  firstExplicitShape: (type: string, environment: CandidateEnvironmentEntry[]) => ProjectionFunctionShape | null;
  unifyDomain: (
    state: State,
    domain: string,
    sourceType: string,
    environment: CandidateEnvironmentEntry[],
  ) => Substitutions | null;
  applySubstitutions: (state: State, substitutions: Substitutions) => State;
  resolveType: (type: string, substitutions: Substitutions) => string;
};

export function projectionCandidateProvider<State, Substitutions>({
  state,
  environment,
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
    const shape = firstExplicitShape(prepared.candidate.type, environment);
    if (!shape) return [];
    const substitutions = unifyDomain(prepared.state, shape.domain, source.type, environment);
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
