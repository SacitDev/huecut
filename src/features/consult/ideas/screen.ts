/**
 * The Ideas screen's shared view: what its parts read from the machine through the port's selectors, and
 * the local UI state they share: the one question open in place, the polite announcement, and where focus goes after the
 * list changes. Nothing of the machine's state is copied into React state.
 */
import { useEffect, useRef, useState } from 'react';
import type { Recommendation } from '../../../domain/engine/recommend.ts';
import type { Facts } from '../../../domain/facts/registry.ts';
import type { ItemId, Look } from '../../../domain/ids.ts';
import type { IdeaList } from '../../../machine/consult.selectors.ts';
import type { ConsultContext, ConsultGoal } from '../../../machine/consult.types.ts';
import type { ConsultPort, StepProps } from '../useConsult.ts';
import { idsOfLook } from '../../../domain/ids.ts';
import { useDetails, type Details } from './useDetails.ts';

/** The question opened in place on one idea; one at a time, so a question's options never appear twice on the page. */
export interface Asking {
  readonly idea: ItemId;
  readonly question: string;
}

export interface IdeasScreen {
  readonly port: ConsultPort;
  readonly context: ConsultContext;
  readonly goal: ConsultGoal;
  readonly facts: Facts;
  readonly engine: Recommendation;
  readonly list: IdeaList;
  /** The list as results: each cut with the colour chosen for it. */
  readonly looks: readonly Look[];
  readonly details: Details;
  readonly asking: Asking | null;
  readonly ask: (asking: Asking | null) => void;
  readonly announce: (message: string) => void;
  /** Focuses what `find` returns once the screen has re-rendered (after a move, a removal or a closed question). */
  readonly focusAfter: (find: () => HTMLElement | null) => void;
}

/** The screen's view, or `null` engine before a goal is chosen (the step's `canEnter` rules that out). */
export function useIdeasScreen({ port, view }: StepProps) {
  const { context } = view;
  const engine = port.selectors.recommendation(context)?.engine ?? null;
  const list = port.selectors.ideas(context);
  const looks = port.selectors.looks(context);
  const details = useDetails([...new Set([...looks.flatMap(idsOfLook), ...(engine?.pool.map((i) => i.id) ?? []), ...(engine?.worthAsking.map((c) => c.idea.id) ?? [])])]);
  const [asking, ask] = useState<Asking | null>(null);
  const [message, announce] = useState('');
  const pending = useRef<(() => HTMLElement | null) | null>(null);
  useEffect(() => {
    const find = pending.current;
    pending.current = null;
    find?.()?.focus();
  });
  const goal = context.prefs.goal;
  const facts = port.selectors.facts(context);
  const focusAfter = (find: () => HTMLElement | null): void => {
    pending.current = find;
  };
  const screen: IdeasScreen | null =
    goal === null || engine === null ? null : { port, context, goal, facts, engine, list, looks, details, asking, ask, announce, focusAfter };
  return { screen, message };
}
