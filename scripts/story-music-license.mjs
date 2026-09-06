// Copyright 2026 Adam Petcher (to the extent copyright subsists)
// SPDX-License-Identifier: Apache-2.0

const CC0_URL = "https://creativecommons.org/publicdomain/zero/1.0/";

function publicDomainAdaptationNotice(composer) {
  return `Underlying composition by ${composer} is in the public domain. To the extent LeanQuest contributors hold any copyright or related rights in this MIDI adaptation, those rights are waived under CC0 1.0. ${CC0_URL}`;
}

export const STORY_MUSIC_COPYRIGHT_NOTICES = {
  "title.mid": publicDomainAdaptationNotice("William Byrd"),
  "story-induction.mid": publicDomainAdaptationNotice("J. S. Bach"),
  "story-rescue-fugue.mid": publicDomainAdaptationNotice("J. S. Bach"),
};
