// Copyright 2026 Adam Petcher
// SPDX-License-Identifier: Apache-2.0

"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import {
  curriculum,
  catalogueMoveDefinitions,
  depthNames,
  exercises,
  lessonTextFor,
  newMoveText,
  unlockedMoves,
  storySequences,
  type HeroClass,
  type MoveId,
  type MonsterSpec,
  type StoryImageLayer,
  type StorySequence,
} from "./curriculum";
import {
  environmentLines,
  createProofState,
  currentTarget,
  getMoveChoices,
  isSolved,
  normalizeFocusedHole,
  pendingArgumentType,
  renderProof,
  renderProofParts,
  renderTacticProofLines,
  type MoveChoice,
  type ProofState,
} from "./proof-engine";
import { attackDamageFor, MAX_HP, MAX_MANA, MAX_VISION_POINTS, RESOURCE_CONSUMPTION_ENABLED } from "./game-balance";
import { canSelectHero, destinationFromTitle } from "./campaign-progress";
import { MusicControls, useGameMusic } from "./game-music";
import { storyMusic, type MusicCueId } from "./music-manifest";
import {
  shouldAutoOpenLesson,
  tutorialAllowsChoice,
  tutorialChoiceAdvances,
  tutorialForLevel,
  type TutorialTarget,
} from "./tutorials";

type MonsterPhase = "idle" | "attack" | "death" | "gone";
type SaveData = {
  selectedClass?: HeroClass;
  completed: Record<HeroClass, number[]>;
  level: Record<HeroClass, number>;
  seenLessons: Record<HeroClass, number[]>;
  seenStories: string[];
  seenTutorials: string[];
};

type StoryDestination = { kind: "character" } | { kind: "level"; index: number; suppressTutorial?: boolean } | { kind: "map" };
type CSSPropertiesWithVariables = CSSProperties & {
  [name: `--${string}`]: string | number | undefined;
};

function formatInlineCode(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).filter(Boolean).map((part, index) =>
    part.startsWith("`") && part.endsWith("`")
      ? <code key={`${index}-${part}`}>{part.slice(1, -1)}</code>
      : part
  );
}

const STORAGE_KEY = "leanquest-campaign-v6";
const emptySave: SaveData = {
  completed: { champion: [], apprentice: [] },
  level: { champion: 0, apprentice: 0 },
  seenLessons: { champion: [], apprentice: [] },
  seenStories: [],
  seenTutorials: [],
};
const FINAL_LEVEL_ID = exercises[exercises.length - 1].id;

function storiesBeforeFirstLevel() {
  const firstLevel = curriculum.findIndex((entry) => entry.kind === "level");
  return curriculum.slice(0, firstLevel).filter((entry): entry is StorySequence => entry.kind === "story");
}

function storiesAfterLevel(levelId: number, hero: HeroClass) {
  const levelPosition = curriculum.findIndex((entry) => entry.kind === "level" && entry.id === levelId);
  if (levelPosition < 0) return [];
  const stories: StorySequence[] = [];
  for (const entry of curriculum.slice(levelPosition + 1)) {
    if (entry.kind === "level") break;
    if (!entry.hero || entry.hero === hero) stories.push(entry);
  }
  return stories;
}

function requiredLevelForStory(storyId: string) {
  let previousLevel = 0;
  for (const entry of curriculum) {
    if (entry.kind === "story" && entry.id === storyId) return previousLevel;
    if (entry.kind === "level") previousLevel = entry.id;
  }
  return Number.POSITIVE_INFINITY;
}

function storyLayerStyle(layer: StoryImageLayer): CSSPropertiesWithVariables {
  const usesInset = Boolean(layer.layout?.inset) || (!layer.layout?.left && !layer.layout?.top);
  return {
    ...(usesInset
      ? { inset: layer.layout?.inset ?? "0" }
      : {
          left: layer.layout?.left,
          top: layer.layout?.top,
          width: layer.layout?.width,
          height: layer.layout?.height,
        }),
    opacity: layer.layout?.opacity,
    "--story-cycle-duration": `${(layer.frameDurationMs ?? 800) * 2}ms`,
  };
}

function monsterVisual(monster: MonsterSpec, hero: HeroClass) {
  const filter = `hue-rotate(${monster.hueShift[hero]}deg) saturate(${hero === "apprentice" ? 1.08 : 1}) drop-shadow(10px 12px 0 rgba(0,0,0,.7))`;
  if ("image" in monster.sprite) {
    return {
      backgroundImage: `url("/assets/cc0_images/${monster.sprite.image}")`,
      backgroundPosition: "center",
      backgroundSize: "contain",
      filter,
    };
  }

  const { cell, sheet } = monster.sprite;
  const x = [0, 25, 50, 75, 100][cell % 5];
  const y = cell < 5 ? 0 : 100;
  return {
    backgroundImage: `url("/assets/cc0_images/${sheet}")`,
    backgroundPosition: `${x}% ${y}%`,
    filter,
  };
}

function heroPosition(hero: HeroClass) {
  return hero === "champion" ? "0% 50%" : "100% 50%";
}

function heroSelectionPosition(hero: HeroClass) {
  return hero === "champion" ? "10% 50%" : "90% 50%";
}

function maxManaFor(hero: HeroClass) {
  return MAX_MANA[hero];
}

function visionFor(hero: HeroClass) {
  return hero === "champion" ? MAX_VISION_POINTS : 0;
}

export default function Home() {
  const [save, setSave] = useState<SaveData>(emptySave);
  const [heroClass, setHeroClass] = useState<HeroClass | null>(null);
  const [showTitle, setShowTitle] = useState(true);
  const [showBetaStatus, setShowBetaStatus] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [levelIndex, setLevelIndex] = useState(0);
  const [proofState, setProofState] = useState<ProofState>(() =>
    createProofState(exercises[0].theorem, exercises[0].environment),
  );
  const [undoStack, setUndoStack] = useState<ProofState[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [showCatalogue, setShowCatalogue] = useState(false);
  const [showLesson, setShowLesson] = useState(false);
  const [ready, setReady] = useState(false);
  const [monsterPhase, setMonsterPhase] = useState<MonsterPhase>("idle");
  const [hp, setHp] = useState(MAX_HP.champion);
  const [mana, setMana] = useState(0);
  const [visionPoints, setVisionPoints] = useState(MAX_VISION_POINTS);
  const [enteringNaturalNumber, setEnteringNaturalNumber] = useState(false);
  const [naturalNumber, setNaturalNumber] = useState("");
  const [storyQueue, setStoryQueue] = useState<StorySequence[]>([]);
  const [storyPanelIndex, setStoryPanelIndex] = useState(0);
  const [storyDestination, setStoryDestination] = useState<StoryDestination | null>(null);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [replayingTutorialId, setReplayingTutorialId] = useState<string | null>(null);
  const [suppressedTutorialId, setSuppressedTutorialId] = useState<string | null>(null);
  const animationTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const naturalNumberInput = useRef<HTMLInputElement>(null);
  const proofScrollCard = useRef<HTMLElement>(null);
  const tutorialProofOverlay = useRef<HTMLElement>(null);

  const level = exercises[levelIndex];
  const solved = isSolved(proofState);
  const proofFailed = RESOURCE_CONSUMPTION_ENABLED && hp === 0 && !solved;
  const target = solved ? "No goals" : currentTarget(proofState);
  const requiredArgumentType = pendingArgumentType(proofState);
  const displayedEnvironment = environmentLines(proofState);
  const history = proofState.moves;
  const choices = heroClass && !solved && !proofFailed
    ? getMoveChoices(proofState, heroClass, level.id)
    : [];
  const numberInputChoice = choices.find((choice) => choice.input === "natural-number");
  const submittedNaturalNumber = naturalNumber || "0";
  const completed = heroClass ? save.completed[heroClass] : [];
  const unlockedThrough = Math.min(exercises.length, Math.max(1, completed.length + 1));
  const catalogueUnlocks = heroClass ? unlockedMoves(unlockedThrough, heroClass) : new Set<MoveId>();
  const catalogueGroups = Object.entries(catalogueMoveDefinitions)
    .filter(([moveId]) => catalogueUnlocks.has(moveId as MoveId))
    .reduce((groups, [moveId, definition]) => {
      if (definition.kind === "term") {
        definition.entries.forEach((entry) => {
          const groupName = entry.group ?? definition.group;
          const current = groups.get(groupName) ?? { terms: new Map<string, { name: string; type: string }>(), tactics: [] as { id: string; label: string; description: string }[] };
          current.terms.set(`${entry.name}\n${entry.type}`, entry);
          groups.set(groupName, current);
        });
      } else {
        const current = groups.get(definition.group) ?? { terms: new Map<string, { name: string; type: string }>(), tactics: [] as { id: string; label: string; description: string }[] };
        current.tactics.push({ id: moveId, label: definition.label, description: definition.description });
        groups.set(definition.group, current);
      }
      return groups;
    }, new Map<string, { terms: Map<string, { name: string; type: string }>; tactics: { id: string; label: string; description: string }[] }>());
  const catalogueGroupOrder = ["Term building", "Logic", "Equality & quantifiers", "Equality", "Quantifiers", "Nat", "List", "Recursion", "Core tactics"];
  const activeStory = storyQueue[0];
  const activeStoryPanel = activeStory?.panels[storyPanelIndex];
  const maxMana = heroClass ? maxManaFor(heroClass) : 0;
  const maxHp = heroClass ? MAX_HP[heroClass] : MAX_HP.champion;
  const attackDamage = heroClass ? attackDamageFor(heroClass, level[heroClass].selections.length) : 0;
  const tutorial = heroClass ? tutorialForLevel(heroClass, level.id) : undefined;
  const moveUnlockText = heroClass ? newMoveText(level, heroClass) : "";
  const pendingTutorialStep = tutorial?.steps[tutorialStepIndex] ?? null;
  const tutorialLibraryIsOpen = showCatalogue && pendingTutorialStep?.action.type === "close-library";
  const tutorialIsActive = Boolean(
    ready && !showTitle && !showCharacterSelect && !showMap && (!showCatalogue || tutorialLibraryIsOpen) && !showLesson && !activeStory &&
    tutorial && (replayingTutorialId === tutorial.id || (
      suppressedTutorialId !== tutorial.id && !save.seenTutorials.includes(tutorial.id)
    )),
  );
  const tutorialStep = tutorialIsActive ? pendingTutorialStep : null;
  const tutorialTargets = new Set(tutorialStep?.targets ?? []);
  const showProofSpotlight = tutorialTargets.has("proof-scroll");
  const showEnvironmentSpotlight = tutorialTargets.has("environment");
  const showTopbarSpotlight = ["character-select", "map", "library-button"].some((target) =>
    tutorialTargets.has(target as TutorialTarget),
  );
  const tutorialClass = (target: TutorialTarget) => tutorialTargets.has(target) ? " tutorial-highlight" : "";
  const currentMusicCue: MusicCueId | null = !ready
    ? null
    : activeStory
      ? storyMusic[activeStory.id] ?? "title"
      : showTitle || showCharacterSelect || !heroClass
        ? "title"
        : solved
          ? "victory"
          : "combat";
  const music = useGameMusic(currentMusicCue);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SaveData;
          const restored = parsed.selectedClass && !canSelectHero(parsed.selectedClass, parsed.completed, FINAL_LEVEL_ID)
            ? { ...parsed, selectedClass: undefined }
            : parsed;
          setSave(restored);
          if (restored.selectedClass) {
            setHeroClass(restored.selectedClass);
            setHp(MAX_HP[restored.selectedClass]);
            setMana(maxManaFor(restored.selectedClass));
            setVisionPoints(visionFor(restored.selectedClass));
            const restoredIndex = Math.min(restored.level[restored.selectedClass], exercises.length - 1);
            setLevelIndex(restoredIndex);
            setProofState(createProofState(exercises[restoredIndex].theorem, exercises[restoredIndex].environment));
          }
        } else {
          setSave(emptySave);
        }
      } catch {
        setSave(emptySave);
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  }, [ready, save]);

  useEffect(
    () => () => animationTimers.current.forEach(clearTimeout),
    [],
  );

  useEffect(() => {
    if (enteringNaturalNumber) naturalNumberInput.current?.focus();
  }, [enteringNaturalNumber]);

  useEffect(() => {
    if (!showProofSpotlight) return;
    const anchor = proofScrollCard.current;
    const overlay = tutorialProofOverlay.current;
    if (!anchor || !overlay) return;

    const placeOverlay = () => {
      const rect = anchor.getBoundingClientRect();
      overlay.style.left = `${rect.left}px`;
      overlay.style.top = `${rect.top}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.visibility = "visible";
    };
    const frame = requestAnimationFrame(placeOverlay);
    const observer = new ResizeObserver(placeOverlay);
    observer.observe(anchor);
    window.addEventListener("resize", placeOverlay);
    window.addEventListener("scroll", placeOverlay, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", placeOverlay);
      window.removeEventListener("scroll", placeOverlay, true);
    };
  }, [showProofSpotlight]);

  function clearAnimations() {
    animationTimers.current.forEach(clearTimeout);
    animationTimers.current = [];
  }

  function selectClass(nextClass: HeroClass) {
    if (!canSelectHero(nextClass, save.completed, FINAL_LEVEL_ID)) return;
    clearAnimations();
    const nextIndex = Math.min(save.level[nextClass], exercises.length - 1);
    setHeroClass(nextClass);
    setLevelIndex(nextIndex);
    setProofState(createProofState(exercises[nextIndex].theorem, exercises[nextIndex].environment));
    setUndoStack([]);
    setMonsterPhase("idle");
    setHp(MAX_HP[nextClass]);
    setMana(maxManaFor(nextClass));
    setVisionPoints(visionFor(nextClass));
    setEnteringNaturalNumber(false);
    setNaturalNumber("");
    setTutorialStepIndex(0);
    setReplayingTutorialId(null);
    setSuppressedTutorialId(null);
    setShowCharacterSelect(false);
    setSave((current) => ({ ...current, selectedClass: nextClass }));
    setShowLesson(shouldAutoOpenLesson(nextClass, exercises[nextIndex].id, save.seenLessons[nextClass]));
  }

  function choose(choice: MoveChoice, value?: string) {
    if (!heroClass || monsterPhase !== "idle" || proofFailed) return;
    if (!tutorialAllowsChoice(tutorialStep, choice.id)) return;
    if (RESOURCE_CONSUMPTION_ENABLED && mana < choice.manaCost) {
      return;
    }
    if (choice.input === "natural-number" && value === undefined) {
      setNaturalNumber("");
      setEnteringNaturalNumber(true);
      return;
    }
    const nextState = choice.apply(value);
    const completedProof = isSolved(nextState);
    setEnteringNaturalNumber(false);
    setNaturalNumber("");
    setUndoStack((items) => [...items, proofState]);
    setProofState(nextState);
    if (tutorialChoiceAdvances(tutorialStep, choice.id, value)) {
      if (tutorial && tutorialStepIndex === tutorial.steps.length - 1) {
        setSave((current) => ({
          ...current,
          seenTutorials: current.seenTutorials.includes(tutorial.id)
            ? current.seenTutorials
            : [...current.seenTutorials, tutorial.id],
        }));
      }
      setTutorialStepIndex((current) => current + 1);
    }
    if (RESOURCE_CONSUMPTION_ENABLED) {
      setMana((current) => current - choice.manaCost);
    }

    if (completedProof) {
      setMonsterPhase("death");
      setSave((current) => {
        const classCompleted = current.completed[heroClass];
        return {
          ...current,
          completed: {
            ...current.completed,
            [heroClass]: classCompleted.includes(level.id)
              ? classCompleted
              : [...classCompleted, level.id].sort((a, b) => a - b),
          },
        };
      });
      animationTimers.current.push(
        setTimeout(() => setMonsterPhase("gone"), 1300),
      );
    } else {
      const nextHp = RESOURCE_CONSUMPTION_ENABLED
        ? Math.max(0, hp - attackDamage)
        : hp;
      setHp(nextHp);
      setMonsterPhase("attack");
      animationTimers.current.push(setTimeout(() => setMonsterPhase("idle"), 620));
    }
  }

  function submitNaturalNumber(value: string) {
    const submittedValue = value || "0";
    if (numberInputChoice?.acceptsInput?.(submittedValue)) {
      choose(numberInputChoice, submittedValue);
    }
  }

  function undo() {
    if (proofFailed) return;
    const previous = undoStack.at(-1);
    if (!previous) return;
    clearAnimations();
    setMonsterPhase("idle");
    setProofState(previous);
    setEnteringNaturalNumber(false);
    setNaturalNumber("");
    setUndoStack((items) => items.slice(0, -1));
  }

  function revealWithVision() {
    if (heroClass !== "champion" || visionPoints < 1 || monsterPhase !== "idle" || solved || proofFailed) return;
    const normalized = normalizeFocusedHole(proofState);
    if (normalized === proofState) return;
    setProofState(normalized);
    setVisionPoints((current) => current - 1);
  }

  function reset() {
    clearAnimations();
    setMonsterPhase("idle");
    setHp(heroClass ? MAX_HP[heroClass] : MAX_HP.champion);
    setMana(heroClass ? maxManaFor(heroClass) : 0);
    setVisionPoints(heroClass ? visionFor(heroClass) : MAX_VISION_POINTS);
    setProofState(createProofState(level.theorem, level.environment));
    setUndoStack([]);
    setEnteringNaturalNumber(false);
    setNaturalNumber("");
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (showCredits && event.key === "Escape") {
        setShowCredits(false);
        return;
      }
      if (showCredits || showCharacterSelect || showMap || showCatalogue || showLesson || enteringNaturalNumber || tutorialStep || proofFailed) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function openLesson(markSeen = false) {
    if (!heroClass) return;
    setShowLesson(true);
    if (markSeen) {
      setSave((current) => ({
        ...current,
        seenLessons: {
          ...current.seenLessons,
          [heroClass]: current.seenLessons[heroClass].includes(level.id)
            ? current.seenLessons[heroClass]
            : [...current.seenLessons[heroClass], level.id],
        },
      }));
    }
  }

  function closeLesson() {
    if (!heroClass) return;
    setShowLesson(false);
    setSave((current) => ({
      ...current,
      seenLessons: {
        ...current.seenLessons,
        [heroClass]: current.seenLessons[heroClass].includes(level.id)
          ? current.seenLessons[heroClass]
          : [...current.seenLessons[heroClass], level.id],
      },
    }));
  }

  function startTutorialFromLesson() {
    if (!tutorial) return;
    closeLesson();
    reset();
    setTutorialStepIndex(0);
    setReplayingTutorialId(tutorial.id);
    setSuppressedTutorialId(null);
  }

  function goToLevel(index: number, suppressTutorial = false) {
    if (!heroClass) return;
    if (index + 1 > unlockedThrough && !completed.includes(index + 1)) return;
    const destinationTutorial = tutorialForLevel(heroClass, exercises[index].id);
    clearAnimations();
    setLevelIndex(index);
    setShowMap(false);
    setProofState(createProofState(exercises[index].theorem, exercises[index].environment));
    setUndoStack([]);
    setMonsterPhase("idle");
    setHp(MAX_HP[heroClass]);
    setMana(maxManaFor(heroClass));
    setVisionPoints(visionFor(heroClass));
    setEnteringNaturalNumber(false);
    setNaturalNumber("");
    setTutorialStepIndex(0);
    setReplayingTutorialId(null);
    setSuppressedTutorialId(suppressTutorial ? destinationTutorial?.id ?? null : null);
    setSave((current) => ({
      ...current,
      level: { ...current.level, [heroClass]: index },
    }));
    setShowLesson(shouldAutoOpenLesson(heroClass, exercises[index].id, save.seenLessons[heroClass]));
  }

  function startStories(stories: StorySequence[], destination: StoryDestination) {
    if (!stories.length) return;
    setShowTitle(false);
    setShowMap(false);
    setShowCharacterSelect(false);
    setStoryQueue(stories);
    setStoryPanelIndex(0);
    setStoryDestination(destination);
  }

  function continueFromTitle() {
    const unseenOpening = storiesBeforeFirstLevel().filter((story) => !save.seenStories.includes(story.id));
    const destination = destinationFromTitle(unseenOpening.length > 0, save.selectedClass);
    if (destination === "opening-story") {
      startStories(unseenOpening, { kind: "character" });
      return;
    }
    setShowTitle(false);
    setShowCharacterSelect(destination === "character-select" || !heroClass);
    if (destination === "saved-game" && heroClass) {
      setShowLesson(shouldAutoOpenLesson(heroClass, level.id, save.seenLessons[heroClass]));
    }
  }

  function returnToTitle() {
    setShowCharacterSelect(false);
    setShowTitle(true);
  }

  function arriveAfterStory(destination: StoryDestination | null) {
    if (!destination) return;
    if (destination.kind === "character") {
      setShowCharacterSelect(true);
    } else if (destination.kind === "map") {
      setShowMap(true);
    } else {
      goToLevel(destination.index, destination.suppressTutorial);
    }
  }

  function finishCurrentStory() {
    if (!activeStory) return;
    setSave((current) => ({
      ...current,
      seenStories: current.seenStories.includes(activeStory.id)
        ? current.seenStories
        : [...current.seenStories, activeStory.id],
    }));
    if (storyQueue.length > 1) {
      setStoryQueue((queue) => queue.slice(1));
      setStoryPanelIndex(0);
      return;
    }
    const destination = storyDestination;
    setStoryQueue([]);
    setStoryPanelIndex(0);
    setStoryDestination(null);
    arriveAfterStory(destination);
  }

  function skipStories() {
    if (!storyQueue.length) return;
    setSave((current) => ({
      ...current,
      seenStories: Array.from(new Set([...current.seenStories, ...storyQueue.map((story) => story.id)])),
    }));
    const destination = storyDestination;
    setStoryQueue([]);
    setStoryPanelIndex(0);
    setStoryDestination(null);
    arriveAfterStory(destination);
  }

  function finishStoryAtTitle() {
    if (!activeStory) return;
    setSave((current) => ({
      ...current,
      seenStories: current.seenStories.includes(activeStory.id)
        ? current.seenStories
        : [...current.seenStories, activeStory.id],
    }));
    setStoryQueue([]);
    setStoryPanelIndex(0);
    setStoryDestination(null);
    setShowMap(false);
    setShowCharacterSelect(false);
    setShowTitle(true);
  }

  function nextStoryPanel() {
    if (!activeStory) return;
    if (storyPanelIndex < activeStory.panels.length - 1) {
      setStoryPanelIndex((index) => index + 1);
    } else {
      finishCurrentStory();
    }
  }

  function nextLevel() {
    if (tutorialStep) {
      if (tutorialStep.action.type !== "next-level" || !tutorial) return;
      setSave((current) => ({
        ...current,
        seenTutorials: current.seenTutorials.includes(tutorial.id)
          ? current.seenTutorials
          : [...current.seenTutorials, tutorial.id],
      }));
    }
    if (!heroClass) return;
    const isTutorialReplay = replayingTutorialId === tutorial?.id;
    const stories = storiesAfterLevel(level.id, heroClass).filter((story) => !save.seenStories.includes(story.id));
    const destination: StoryDestination = levelIndex >= exercises.length - 1
      ? { kind: "map" }
      : { kind: "level", index: levelIndex + 1, suppressTutorial: isTutorialReplay };
    setReplayingTutorialId(null);
    if (stories.length) {
      startStories(stories, destination);
      return;
    }
    arriveAfterStory(destination);
  }

  function continueTutorial() {
    if (tutorialStep?.action.type !== "continue") return;
    if (tutorial && tutorialStepIndex === tutorial.steps.length - 1) {
      setSave((current) => ({
        ...current,
        seenTutorials: current.seenTutorials.includes(tutorial.id)
          ? current.seenTutorials
          : [...current.seenTutorials, tutorial.id],
      }));
    }
    setTutorialStepIndex((current) => current + 1);
  }

  function openCatalogue() {
    if (tutorialStep) {
      if (tutorialStep.action.type !== "open-library") return;
      setTutorialStepIndex((current) => current + 1);
    }
    setShowCatalogue(true);
  }

  function closeCatalogue() {
    if (tutorialStep) {
      if (tutorialStep.action.type !== "close-library") return;
      setTutorialStepIndex((current) => current + 1);
    }
    setShowCatalogue(false);
  }

  if (!ready) {
    return <main className="loading-shell">ASCENDING THE TOWER...</main>;
  }

  if (showTitle) {
    return (
      <main className="title-screen">
        <div className="screen-music-control"><MusicControls {...music} /></div>
        <section className="title-card" aria-labelledby="game-title">
          <div className="title-heading">
            <h1 id="game-title">LEANQUEST</h1>
            <button className="title-beta" onClick={() => setShowBetaStatus(true)}>Beta</button>
          </div>
          <div className="title-art pixel-frame" role="img" aria-label="An endless stone staircase climbing toward a distant golden light">
            <Image className="title-frame title-frame-1" src="/assets/cc0_images/title/infinite-stair-1.png" alt="" fill priority sizes="(max-width: 650px) 100vw, 820px" />
            <Image className="title-frame title-frame-2" src="/assets/cc0_images/title/infinite-stair-2.png" alt="" fill loading="eager" sizes="(max-width: 650px) 100vw, 820px" />
            <div className="title-vignette" aria-hidden="true" />
          </div>
          <div className="title-actions">
            <button className="title-continue primary-button" onClick={continueFromTitle}>CONTINUE</button>
            <button className="title-credits" onClick={() => setShowCredits(true)}>Credits</button>
          </div>
        </section>
        {showBetaStatus && (
          <div className="modal-backdrop status-backdrop" onMouseDown={() => setShowBetaStatus(false)}>
            <section className="status-modal pixel-frame" role="dialog" aria-modal="true" aria-labelledby="status-title" onMouseDown={(event) => event.stopPropagation()}>
              <header className="status-header">
                <div>
                  <p className="eyebrow">LEANQUEST</p>
                  <h2 id="status-title">STATUS</h2>
                </div>
                <button className="close-button" aria-label="Close beta status" onClick={() => setShowBetaStatus(false)}>×</button>
              </header>
              <p className="status-description">
                LeanQuest is an open source project currently in Beta testing. Please use the link below to access the GitHub repository, and submit any problems or suggestions using the issue tracker. If you have artistic ability, please consider contributing art to replace the AI-generated placeholder art. 
              </p>
              <a className="status-repository" href="https://github.com/leanquest/leanquest.github.io" target="_blank" rel="noreferrer">
                View the repository
              </a>
            </section>
          </div>
        )}
        {showCredits && (
          <div className="modal-backdrop credits-backdrop" onMouseDown={() => setShowCredits(false)}>
            <section className="credits-modal pixel-frame" role="dialog" aria-modal="true" aria-labelledby="credits-title" onMouseDown={(event) => event.stopPropagation()}>
              <header className="credits-header">
                <div>
                  <p className="eyebrow">LEANQUEST</p>
                  <h2 id="credits-title">CREDITS</h2>
                </div>
                <button className="close-button" aria-label="Close credits" onClick={() => setShowCredits(false)}>×</button>
              </header>

              <div className="credits-team">
                <div><span>GAME DESIGN</span><strong>Adam Petcher</strong></div>
                <div><span>COMBAT MUSIC</span><strong>Susan Petcher</strong><small>© 2026 · <a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noreferrer">CC BY-NC 4.0</a> · adapted with custom chiptune synthesis</small></div>
                <div><span>PROGRAMMING &amp; ART</span><strong>GPT 5.6</strong></div>
              </div>
              <section className="credits-score" aria-labelledby="story-music-title">
                <h3 id="story-music-title">Story Music</h3>
                <div className="credits-story-list">
                  <article className="credits-story">
                    <div><strong>Intro</strong></div>
                    <p><cite>Ave Verum Corpus</cite><small>William Byrd · LeanQuest transcription checked against <a href="https://stcpress.org/pieces/ave_verum_corpus" target="_blank" rel="noreferrer">Monique Rio’s CC BY 4.0 edition</a></small></p>
                  </article>
                  <article className="credits-story">
                    <div><strong>Interlude</strong></div>
                    <p><cite>Gib dich zufrieden und sei stille</cite><small>J. S. Bach · BWV 511</small></p>
                  </article>
                  <article className="credits-story">
                    <div><strong>Finale</strong></div>
                    <p><cite>Fugue in G minor, BWV 542/2</cite><small>J. S. Bach</small></p>
                  </article>
                </div>
                <p className="credits-music-license">Underlying compositions are public domain. LeanQuest MIDI adaptations are released under CC0 1.0.</p>
              </section>
              <nav className="credits-legal" aria-label="Legal notices">
                <a href="/legal/APACHE-2.0.txt" target="_blank" rel="noreferrer">LeanQuest source license</a>
                <a href="/legal/THIRD_PARTY_NOTICES.txt" target="_blank" rel="noreferrer">Third-party licenses</a>
                <a href="/assets/cc0_images/LICENSE.md" target="_blank" rel="noreferrer">Image license</a>
                <a href="/music/LICENSE-COMBAT.md" target="_blank" rel="noreferrer">Combat music license</a>
                <a href="/music/LICENSE-STORY.md" target="_blank" rel="noreferrer">Story music notice</a>
              </nav>
              <p className="credits-lean-notice">
                LeanQuest is an independent educational game based on the <a href="https://lean-lang.org" target="_blank" rel="noreferrer">Lean programming language</a>. Lean is a trademark of Lean FRO, LLC. LeanQuest is not affiliated with or endorsed by Lean FRO.
              </p>
            </section>
          </div>
        )}
      </main>
    );
  }

  if (activeStory && activeStoryPanel) {
    return (
      <main className="story-screen">
        <div className="screen-music-control"><MusicControls {...music} /></div>
        <section className="story-viewer pixel-frame" aria-labelledby="story-panel-title">
          <div className="story-image" aria-label={`Story image ${storyPanelIndex + 1} of ${activeStory.panels.length}`}>
            {activeStoryPanel.layers.map((layer) => (
              <div className={`story-layer ${layer.frames.length === 2 ? "animated" : ""}`} style={storyLayerStyle(layer)} key={layer.id}>
                {layer.frames.map((frame, index) => (
                  <img
                    className={`story-frame story-frame-${index + 1}`}
                    src={frame}
                    alt={index === 0 ? layer.alt ?? "" : ""}
                    style={{ objectFit: layer.layout?.objectFit ?? "contain" }}
                    key={frame}
                  />
                ))}
              </div>
            ))}
            <div className="story-vignette" aria-hidden="true" />
            <div className="story-counter">{String(storyPanelIndex + 1).padStart(2, "0")} / {String(activeStory.panels.length).padStart(2, "0")}</div>
          </div>
          <div className="story-copy">
            <p className="eyebrow">STORY · {activeStory.title}</p>
            <h1 id="story-panel-title">{activeStoryPanel.title}</h1>
            <div className="story-text">{activeStoryPanel.text.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
            <div className="story-actions">
              <button onClick={() => setStoryPanelIndex((index) => Math.max(0, index - 1))} disabled={storyPanelIndex === 0}>◀ BACK</button>
              {activeStoryPanel.completionAction === "return-to-title"
                ? <span aria-hidden="true" />
                : <button className="story-skip" onClick={skipStories}>SKIP STORY</button>}
              <button
                className="primary-button"
                onClick={activeStoryPanel.completionAction === "return-to-title" ? finishStoryAtTitle : nextStoryPanel}
              >
                {activeStoryPanel.completionAction === "return-to-title"
                  ? "RETURN TO TITLE"
                  : `${storyPanelIndex === activeStory.panels.length - 1 ? "CONTINUE" : "NEXT"} ▶`}
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (showCharacterSelect || !heroClass) {
    return (
      <main className="character-screen">
        <div className="screen-music-control"><MusicControls {...music} /></div>
        <div className="character-backdrop">
          <div className="select-title">
            <span className="brand-mark">λ</span>
            <p>LEANQUEST</p>
            <h1>CHOOSE YOUR PATH</h1>
            <small>Your class determines the proof language you will learn.</small>
          </div>
          <section className="class-grid">
            {(["apprentice", "champion"] as HeroClass[]).map((hero) => {
              const isLocked = !canSelectHero(hero, save.completed, FINAL_LEVEL_ID);
              return (
                <button
                  className={`class-card ${hero}${isLocked ? " locked" : ""}`}
                  key={hero}
                  onClick={() => selectClass(hero)}
                  disabled={isLocked}
                  aria-label={isLocked ? `Champion locked until Apprentice level ${FINAL_LEVEL_ID} is complete` : undefined}
                >
                  <div className="class-art" style={{ backgroundPosition: heroSelectionPosition(hero) }} />
                  <div className="class-copy">
                    <span>{hero === "champion" ? "PATH OF TERMS" : "PATH OF TACTICS"}</span>
                    <h2>{hero.toUpperCase()}</h2>
                    <p>
                      {hero === "champion"
                        ? "Forge proofs directly from functions, constructors, recursors, and applications. No tactics are available."
                        : "Cast tactics to transform goals, selecting only the simple terms and names each spell requires."}
                    </p>
                    <div className="class-progress">
                      <i style={{ width: `${(save.completed[hero].length / exercises.length) * 100}%` }} />
                    </div>
                    <strong>{isLocked ? `UNLOCK AFTER APPRENTICE LEVEL ${FINAL_LEVEL_ID}` : `${save.completed[hero].length}/${exercises.length} GUARDIANS SLAIN`}</strong>
                    <b>{isLocked ? "LOCKED · COMPLETE THE APPRENTICE PATH" : `${save.completed[hero].length ? "CONTINUE" : "BEGIN"} AS ${hero.toUpperCase()} ▶`}</b>
                  </div>
                </button>
              );
            })}
          </section>
          <div className="character-actions">
            <button className="return-button" onClick={returnToTitle}>◀ MAIN TITLE</button>
            {save.selectedClass && (
              <button className="return-button" onClick={() => setShowCharacterSelect(false)}>
                CANCEL · RETURN TO {save.selectedClass.toUpperCase()}
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  const proofDisplay =
    heroClass === "apprentice"
      ? renderTacticProofLines(proofState)
      : [];
  const termProofDisplay = heroClass === "champion" ? renderProofParts(proofState) : [];
  const visual = monsterVisual(level.monster, heroClass);
  const renderProofScrollContent = () => heroClass === "champion" ? (
    <span>
      {termProofDisplay.map((part, index) =>
        part.hole
          ? <span className={`proof-hole ${part.active ? "active" : ""}`} key={`${part.text}-${index}`}>□</span>
          : <span key={`${part.text}-${index}`}>{part.text}</span>
      )}
      {"\n"}
    </span>
  ) : proofDisplay.map((line, index) => {
    let highlightedHole = false;
    const highlightFirstHole = Boolean(proofState.pending) && index === proofDisplay.length - 1;
    return (
      <span key={`${line}-${index}`}>
        {line.split(/(□)/).map((piece, pieceIndex) => {
          if (piece !== "□") return piece;
          const active = highlightFirstHole && !highlightedHole;
          highlightedHole = highlightedHole || active;
          return <span className={`proof-hole ${active ? "active" : ""}`} key={`${piece}-${pieceIndex}`}>□</span>;
        })}
        {"\n"}
      </span>
    );
  });

  return (
    <main className={`app-shell hero-${heroClass} ${monsterPhase === "attack" ? "under-attack" : ""} ${proofFailed ? "proof-failed" : ""} ${tutorialStep ? "tutorial-active" : ""}`}>
      <header
        className={`topbar pixel-frame${showTopbarSpotlight ? " tutorial-topbar-parent" : ""}`}
        style={showTopbarSpotlight ? { zIndex: 71, isolation: "isolate" } : undefined}
      >
        <button className="brand" onClick={() => setShowMap(true)} aria-label="Open tower map">
          <span className="brand-mark">λ</span>
          <span><strong>LEANQUEST</strong><small>{heroClass === "champion" ? "PATH OF TERMS" : "PATH OF TACTICS"}</small></span>
        </button>
        <div className="quest-progress" aria-label={`${completed.length} of ${exercises.length} levels complete`}>
          <div className="progress-copy">
            <span>DEPTH {String(level.depth).padStart(2, "0")} · {depthNames[level.depth - 1]}</span>
            <strong>{completed.length}/{exercises.length} SLAIN</strong>
          </div>
          <div className="progress-track"><span style={{ width: `${(completed.length / exercises.length) * 100}%` }} /></div>
        </div>
        <div className="top-actions">
          <MusicControls {...music} />
          <button className={`class-button${tutorialClass("character-select")}`} onClick={() => {
            if (!tutorialStep) setShowCharacterSelect(true);
          }}>
            <span className="hero-icon" style={{ backgroundPosition: heroPosition(heroClass) }} />
            {heroClass.toUpperCase()}
          </button>
          <button className={`map-button${tutorialClass("map")}`} onClick={() => {
            if (!tutorialStep) setShowMap(true);
          }}><span>▦</span> MAP</button>
          <button className={`map-button catalogue-button${tutorialClass("library-button")}`} onClick={openCatalogue}><span>▤</span> LIBRARY</button>
        </div>
      </header>

      <section className="workspace">
        <section className={`encounter pixel-frame phase-${monsterPhase}`}>
          <div className="tower-view">
            <div className="torch torch-left"><i /></div><div className="torch torch-right"><i /></div>
            <div className={`monster-stage${tutorialClass("guardian")}`}>
              <div className={`monster-sprite${level.monster.presence ? ` monster-sprite-${level.monster.presence}` : ""}`} role="img" aria-label={level.monster.name} style={visual} />
              {monsterPhase === "attack" && <div className="claw-flash" aria-hidden="true">{"///"}</div>}
              {monsterPhase === "death" && <div className="death-burst" aria-hidden="true">✦</div>}
            </div>
            <div className="monster-plaque">
              <span>ENCOUNTER {String(level.id).padStart(2, "0")} · DEPTH {level.depth}</span>
              <strong>{level.monster.name}</strong>
              <small>{level.monster.lore}</small>
            </div>
            <div className={`player-hud${tutorialClass("vitals")}`}>
              <div className="hero-portrait" style={{ backgroundPosition: heroPosition(heroClass) }} />
              <div className="vitals">
                <div className="vital-row"><b>HP</b><div className="vital-bar hp" role="meter" aria-label="Player health" aria-valuemin={0} aria-valuemax={maxHp} aria-valuenow={hp}><i style={{ width: `${(hp / maxHp) * 100}%` }} /></div><em>{RESOURCE_CONSUMPTION_ENABLED ? `${hp} / ${maxHp}` : "PAUSED"}</em></div>
                {heroClass === "champion" ? (
                  <div className="vital-row"><b>VP</b><div className="vital-bar vp" role="meter" aria-label="Champion vision points" aria-valuemin={0} aria-valuemax={MAX_VISION_POINTS} aria-valuenow={visionPoints}><i style={{ width: `${(visionPoints / MAX_VISION_POINTS) * 100}%` }} /></div><em>{visionPoints} / {MAX_VISION_POINTS}</em></div>
                ) : (
                  <div className="vital-row"><b>MP</b><div className="vital-bar mp" role="meter" aria-label="Player mana" aria-valuemin={0} aria-valuemax={maxMana} aria-valuenow={mana}><i style={{ width: `${maxMana === 0 ? 0 : (mana / maxMana) * 100}%` }} /></div><em>{RESOURCE_CONSUMPTION_ENABLED ? `${mana} / ${maxMana}` : "PAUSED"}</em></div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="combat-console">
          <div className={`left-console${tutorialTargets.has("proof-scroll") ? " tutorial-proof-parent" : ""}`}>
            <div className="level-strip pixel-frame">
              <div className="level-rune">{String(level.id).padStart(2, "0")}</div>
              <div><p className="eyebrow">{level.chapter} · {level.topic}</p><h1>{level.title}</h1><p>{formatInlineCode(level.intro)}</p></div>
              <div className="heading-actions">
                <button className={tutorialClass("undo").trimStart()} onClick={() => {
                  if (!tutorialStep) undo();
                }} disabled={proofFailed || !undoStack.length}>↶ <span>UNDO</span></button>
                <button className={`${proofFailed ? "restart-button encouraged" : "restart-button"}${tutorialClass("restart-level")}`} onClick={() => {
                  if (!tutorialStep) reset();
                }}>↻ <span>RESTART</span></button>
                <button className={tutorialClass("lesson").trimStart()} onClick={() => {
                  if (!tutorialStep) openLesson();
                }}>i <span>LESSON</span></button>
              </div>
            </div>

            <article className={`theorem-card pixel-frame${tutorialClass("level-objective")}`}>
              <div className="card-label"><span>LEVEL OBJECTIVE</span><span className="verified-dot">CURRICULUM LEVEL</span></div>
              <code>{level.theorem}</code>
            </article>

            <article className={`goals-card pixel-frame${tutorialClass("current-hole")}`} style={showEnvironmentSpotlight ? { position: "relative", zIndex: 72, isolation: "isolate" } : undefined}>
              <div className="card-label" style={showEnvironmentSpotlight ? { filter: "brightness(.18)" } : undefined}><span>{solved ? "COMBAT LOG" : heroClass === "champion" ? "CURRENT HOLE" : "CURRENT GOAL"}</span><span>{solved ? "CLEAR" : "1 ACTIVE"}</span></div>
              {solved ? (
                <div className="victory-state"><div className="victory-sigil">✦</div><div><strong>MONSTER DEFEATED</strong><p>No goals remain. The proof is complete.</p></div></div>
              ) : (
                <>
                  <div className={`environment-list${tutorialClass("environment")}`}>{displayedEnvironment.length ? displayedEnvironment.map((item) => <code key={item}>{item}</code>) : <code>empty environment</code>}</div>
                  <div className="goal-divider" style={showEnvironmentSpotlight ? { filter: "brightness(.18)" } : undefined} />
                  <div className="goal-stack" style={showEnvironmentSpotlight ? { filter: "brightness(.18)" } : undefined}><div className="goal focused"><span>{heroClass === "champion" ? "□" : "⊢"}</span><code>{target}</code></div></div>
                </>
              )}
            </article>

            <article ref={proofScrollCard} className={`source-card pixel-frame${tutorialClass("proof-scroll")}`} aria-hidden={showProofSpotlight || undefined}>
              <div className="card-label"><span>SCROLL OF CONSTRUCTION</span><span>{heroClass === "champion" ? "TERM" : "TACTIC"} FORM</span></div>
              <pre className="proof-scroll" tabIndex={0} aria-label="Current construction">
                {renderProofScrollContent()}
              </pre>
            </article>
          </div>

          <aside className={`moves-column pixel-frame${solved ? " completion-active" : ""}${tutorialClass("move-catalogue")}${tutorialTargets.has("next-level") ? " tutorial-muted-parent" : ""}`}>
            <div className="path-banner">
              <span className="path-symbol">{proofFailed ? "☠" : heroClass === "champion" ? "⚔" : "✦"}</span>
              <span><strong>{proofFailed ? "PROOF FAILED" : heroClass === "champion" ? "TERM CATALOGUE" : "MOVE CATALOGUE"}</strong><small>{proofFailed ? "NO MOVES REMAIN" : "CUMULATIVE · FILTERED BY TYPE"}</small></span>
            </div>
            <div className="move-panel">
              {proofFailed ? (
                <div className="failure-panel">
                  <div className="failure-sigil">☠</div>
                  <p className="eyebrow">HP DEPLETED</p>
                  <h2>PROOF FAILED</h2>
                  <p>The guardian has broken this proof attempt. Restart the level to recover your HP.</p>
                  <button className="restart-level-button" onClick={reset}>↻ RESTART LEVEL</button>
                </div>
              ) : solved ? (
                <div className="completion-panel">
                  <div className="completion-orbit"><span>✦</span></div>
                  <h3>{level.monster.name} falls!</h3>
                  <p>The {heroClass}&apos;s proof used {history.length} moves.</p>
                  <div className="proof-pair"><div><small>COMPLETE {heroClass.toUpperCase()} PROOF</small><code>{heroClass === "champion" ? renderProof(proofState) : proofDisplay.join("\n")}</code></div></div>
                  <button className={`primary-button${tutorialClass("next-level")}`} onClick={nextLevel}>{level.id === exercises.length ? "VIEW TOWER MAP" : "ENTER NEXT CHAMBER"} <span>▶</span></button>
                </div>
              ) : (
                <>
                  <p className="move-instruction">
                    {proofState.pending
                      ? "Fill the selected move's next hole."
                      : `Every displayed move can produce or transform ${target}.`}
                  </p>
                  {requiredArgumentType && (
                    <div className="argument-requirement">
                      <span>REQUIRED TYPE</span>
                      <code>{requiredArgumentType}</code>
                    </div>
                  )}
                  {heroClass === "champion" && (
                    <button className={`normalize-hole-button${tutorialClass("reduce-current-hole")}`} disabled={visionPoints < 1 || monsterPhase !== "idle"} onClick={() => {
                      if (!tutorialStep) revealWithVision();
                    }}>
                      <span>◉</span><span><strong>REDUCE CURRENT HOLE</strong></span><span>1 VP</span>
                    </button>
                  )}
                  {enteringNaturalNumber ? (
                    <form className="natural-number-entry" onSubmit={(event) => {
                      event.preventDefault();
                      submitNaturalNumber(naturalNumber);
                    }}>
                      <label htmlFor="natural-number-input">ENTER A NATURAL NUMBER</label>
                      <input
                        ref={naturalNumberInput}
                        id="natural-number-input"
                        type="text"
                        inputMode="numeric"
                        enterKeyHint="done"
                        pattern="[0-9]+"
                        autoComplete="off"
                        placeholder="0"
                        value={naturalNumber}
                        onChange={(event) => setNaturalNumber(event.target.value.replace(/\D/g, ""))}
                        onBlur={(event) => {
                          if (
                            event.currentTarget.value
                            && window.matchMedia("(max-width: 700px) and (orientation: portrait)").matches
                          ) {
                            submitNaturalNumber(event.currentTarget.value);
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            submitNaturalNumber(event.currentTarget.value);
                            return;
                          }
                          if (event.key === "Escape") {
                            setEnteringNaturalNumber(false);
                            setNaturalNumber("");
                          }
                        }}
                      />
                      <p>Use one or more decimal digits. The complete number counts as one move.</p>
                      <div className="natural-number-actions">
                        <button type="button" disabled={Boolean(tutorialStep)} onClick={() => {
                          setEnteringNaturalNumber(false);
                          setNaturalNumber("");
                        }}>CANCEL</button>
                        <button type="submit" disabled={!numberInputChoice?.acceptsInput?.(submittedNaturalNumber)}>INSERT NUMBER ▶</button>
                      </div>
                    </form>
                  ) : (
                    <div className="choice-grid">
                      {choices.map((choice, index) => {
                        const unaffordable = RESOURCE_CONSUMPTION_ENABLED && mana < choice.manaCost;
                        return (
                          <button className="choice-card" key={choice.id} disabled={monsterPhase !== "idle" || unaffordable || !tutorialAllowsChoice(tutorialStep, choice.id)} title={unaffordable ? "Not enough mana" : undefined} onClick={() => choose(choice)}>
                            <span className="choice-key">{index + 1}</span>
                            <span className="choice-copy"><code>{choice.label}</code>{choice.argumentType && <small>{choice.argumentType}</small>}</span>
                            <span className={`choice-cost ${heroClass === "apprentice" && RESOURCE_CONSUMPTION_ENABLED && choice.manaCost ? "paid" : "free"}`}>{heroClass === "champion" ? "FREE" : RESOURCE_CONSUMPTION_ENABLED ? `${choice.manaCost} MP` : "MP PAUSED"}</span><span className="choice-arrow">▶</span>
                          </button>
                        );
                      })}
                      {!choices.length && <p className="catalogue-empty">No catalogue move fits this branch. Undo and try another route.</p>}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="keyboard-note"><span><kbd>⌘</kbd><kbd>Z</kbd> UNDO</span></div>
          </aside>
        </section>
      </section>

      {tutorialStep && tutorial && (
        <>
          <div className="tutorial-backdrop" aria-hidden="true" />
          {showProofSpotlight && (
            <article ref={tutorialProofOverlay} className="source-card pixel-frame tutorial-proof-overlay">
              <div className="card-label"><span>SCROLL OF CONSTRUCTION</span><span>{heroClass === "champion" ? "TERM" : "TACTIC"} FORM</span></div>
              <pre className="proof-scroll" tabIndex={0} aria-label="Current construction">
                {renderProofScrollContent()}
              </pre>
            </article>
          )}
          <aside
            className={`tutorial-card tutorial-${tutorialStep.placement}${tutorialStep.portraitPlacement ? ` tutorial-portrait-${tutorialStep.portraitPlacement}` : ""}${tutorialStep.compact ? " tutorial-compact" : ""} pixel-frame`}
            style={tutorialStep.compact ? { width: "min(300px, calc(100vw - 28px))", padding: 14 } : undefined}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tutorial-title"
            aria-describedby="tutorial-description"
          >
            <p className="eyebrow">{tutorial.hero.toUpperCase()} TUTORIAL · {tutorialStepIndex + 1}/{tutorial.steps.length}</p>
            <h2 id="tutorial-title">{tutorialStep.title}</h2>
            <p id="tutorial-description">{formatInlineCode(tutorialStep.text)}</p>
            {tutorialStep.action.type === "continue" ? (
              <button className="primary-button" onClick={continueTutorial}>{tutorialStep.action.label} ▶</button>
            ) : (
              <p className="tutorial-action-hint">{formatInlineCode(tutorialStep.hint ?? "")}</p>
            )}
          </aside>
        </>
      )}

      {showLesson && (
        <div className="modal-backdrop lesson-backdrop">
          <section className="lesson-modal pixel-frame" role="dialog" aria-modal="true" aria-labelledby="lesson-title">
            <div className="lesson-class-art" style={{ backgroundPosition: heroPosition(heroClass) }} />
            <div className="lesson-copy">
              <p className="eyebrow">LESSON {String(level.id).padStart(2, "0")} · {level.chapter}</p>
              <h2 id="lesson-title">{level.title}</h2>
              {lessonTextFor(level.lesson, heroClass).map((sentence) => <p key={sentence}>{formatInlineCode(sentence)}</p>)}
              {moveUnlockText && <p>{formatInlineCode(moveUnlockText)}</p>}
              <div className="lesson-actions">
                {tutorial && <button className="lesson-tutorial-button" onClick={startTutorialFromLesson}>START TUTORIAL</button>}
                <button className="primary-button" onClick={closeLesson}>FACE {level.monster.name.toUpperCase()} ▶</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {showCatalogue && (
        <div
          className={`modal-backdrop catalogue-backdrop${tutorialLibraryIsOpen ? " tutorial-library-open" : ""}`}
          style={tutorialLibraryIsOpen ? { zIndex: 71 } : undefined}
          onMouseDown={closeCatalogue}
        >
          <section className={`catalogue-modal pixel-frame${tutorialClass("library-view")}`} role="dialog" aria-modal="true" aria-labelledby="catalogue-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="catalogue-header">
              <div>
                <p className="eyebrow">{heroClass.toUpperCase()} · UNLOCKED KNOWLEDGE</p>
                <h2 id="catalogue-title">MOVE LIBRARY</h2>
                <p>Every move you have earned, arranged by the kind of proof it helps you build.</p>
              </div>
              <button className="close-button" onClick={closeCatalogue} aria-label="Close move library">×</button>
            </div>
            <div className="catalogue-summary">
              <span><strong>{[...catalogueGroups.values()].reduce((count, group) => count + group.terms.size, 0)}</strong> TERM ENTRIES</span>
              <span><strong>{[...catalogueGroups.values()].reduce((count, group) => count + group.tactics.length, 0)}</strong> TACTIC MOVES</span>
              <span className="catalogue-hint">HIDE LIBRARY TO RESUME THE ENCOUNTER</span>
            </div>
            <div className="catalogue-groups">
              {catalogueGroupOrder.map((groupName) => {
                const group = catalogueGroups.get(groupName);
                if (!group) return null;
                return (
                  <section className="catalogue-group" key={groupName}>
                    <h3>{groupName}</h3>
                    <div className="catalogue-entries">
                      {[...group.terms.values()].map((entry) => (
                        <article className="catalogue-entry term-entry" key={`${entry.name}-${entry.type}`}>
                          <div className="catalogue-entry-heading"><span className="catalogue-kind">TERM</span><code>{entry.name}</code></div>
                          <code className="catalogue-type">{entry.type}</code>
                        </article>
                      ))}
                      {group.tactics.map((tactic) => (
                        <article className="catalogue-entry tactic-entry" key={tactic.id}>
                          <div className="catalogue-entry-heading"><span className="catalogue-kind">TACTIC</span><code>{tactic.label}</code></div>
                          <p>{formatInlineCode(tactic.description)}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
            <button className="primary-button catalogue-close-button" onClick={closeCatalogue}>RETURN TO ENCOUNTER ▶</button>
          </section>
        </div>
      )}

      {showMap && (
        <div className="modal-backdrop" onMouseDown={() => setShowMap(false)}>
          <section className="map-modal pixel-frame" role="dialog" aria-modal="true" aria-labelledby="map-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="map-header">
              <div><p className="eyebrow">{heroClass.toUpperCase()} CAMPAIGN</p><h2 id="map-title">TOWER MAP</h2></div>
              <button className="close-button" onClick={() => setShowMap(false)}>×</button>
            </div>
            <p className="map-intro">Each guardian unlocks the next chamber. Champion and Apprentice progress are saved separately.</p>
            <div className="story-archive">
              <h3>STORY ARCHIVE</h3>
              <div className="story-archive-grid">
                {storySequences.filter((story) => !story.hero || story.hero === heroClass).map((story) => {
                  const requiredLevel = requiredLevelForStory(story.id);
                  const isUnlocked = requiredLevel === 0 || completed.includes(requiredLevel);
                  return (
                    <button
                      key={story.id}
                      disabled={!isUnlocked}
                      onClick={() => startStories([story], { kind: "map" })}
                    >
                      <span>{isUnlocked ? "◆" : "◇"}</span>
                      <span><strong>{story.title}</strong><small>{isUnlocked ? `${story.panels.length} PANEL${story.panels.length === 1 ? "" : "S"} · REPLAY` : `UNLOCK AFTER LEVEL ${requiredLevel}`}</small></span>
                      <span>{isUnlocked ? "▶" : ""}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {depthNames.map((depthName, depthIndex) => (
              <div className="map-depth" key={depthName}>
                <h3>DEPTH {depthIndex + 1} · {depthName}</h3>
                <div className="level-grid">
                  {exercises.filter((item) => item.depth === depthIndex + 1).map((item) => {
                    const index = item.id - 1;
                    const isComplete = completed.includes(item.id);
                    const isLocked = item.id > unlockedThrough && !isComplete;
                    return (
                      <button key={item.id} className={`level-tile ${item.id === level.id ? "current" : ""} ${isComplete ? "complete" : ""}`} disabled={isLocked} onClick={() => goToLevel(index)}>
                        <span className="tile-number">{String(item.id).padStart(2, "0")}</span>
                        <span><strong>{item.monster.name}</strong><small>{item.title} · {item.topic}</small></span>
                        <span className="tile-arrow">{isComplete ? "✓" : isLocked ? "◆" : "▶"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
    </main>
  );
}
