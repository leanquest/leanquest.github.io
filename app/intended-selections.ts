// Copyright 2026 Adam Petcher
// SPDX-License-Identifier: Apache-2.0

export type IntendedSelections = { champion: readonly string[]; apprentice: readonly string[] };

export const intendedSelections = {
  "1": {
    "champion": [
      "hp"
    ],
    "apprentice": [
      "exact □",
      "hp"
    ]
  },
  "2": {
    "champion": [
      "fun hP => □",
      "hP"
    ],
    "apprentice": [
      "intro hP",
      "exact □",
      "hP"
    ]
  },
  "3": {
    "champion": [
      "fun hP => □",
      "fun hQ => □",
      "hP"
    ],
    "apprentice": [
      "intro hP",
      "intro hQ",
      "exact □",
      "hP"
    ]
  },
  "4": {
    "champion": [
      "fun hP => □",
      "fun hPQ => □",
      "(□ □)",
      "hPQ",
      "hP"
    ],
    "apprentice": [
      "intro hP",
      "intro hPQ",
      "apply □",
      "hPQ",
      "exact □",
      "hP"
    ]
  },
  "5": {
    "champion": [
      "fun hPQ => □",
      "fun hQR => □",
      "fun hP => □",
      "(□ □)",
      "hQR",
      "(□ □)",
      "hPQ",
      "hP"
    ],
    "apprentice": [
      "intro hPQ",
      "intro hQR",
      "intro hP",
      "apply □",
      "hQR",
      "apply □",
      "hPQ",
      "exact □",
      "hP"
    ]
  },
  "6": {
    "champion": [
      "And.intro"
    ],
    "apprentice": [
      "intro hP",
      "intro hQ",
      "constructor",
      "exact □",
      "hP",
      "exact □",
      "hQ"
    ]
  },
  "7": {
    "champion": [
      "And.left"
    ],
    "apprentice": [
      "intro h",
      "apply □",
      "And.left",
      "exact □",
      "h"
    ]
  },
  "8": {
    "champion": [
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "And.intro",
      "□.□",
      "h",
      "right",
      "□.□",
      "h",
      "left"
    ],
    "apprentice": [
      "intro h",
      "constructor",
      "exact □",
      "h.right",
      "exact □",
      "h.left"
    ]
  },
  "9": {
    "champion": [
      "Or.inl"
    ],
    "apprentice": [
      "intro hP",
      "left",
      "exact □",
      "hP"
    ]
  },
  "10": {
    "champion": [
      "fun hPR => □",
      "fun hQR => □",
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "Or.elim",
      "h",
      "hPR",
      "hQR"
    ],
    "apprentice": [
      "intro hPR",
      "intro hQR",
      "intro h",
      "cases □",
      "h",
      "apply □",
      "hPR",
      "exact □",
      "hP",
      "apply □",
      "hQR",
      "exact □",
      "hQ"
    ]
  },
  "11": {
    "champion": [
      "False.elim"
    ],
    "apprentice": [
      "intro hFalse",
      "exfalso",
      "exact □",
      "hFalse"
    ]
  },
  "12": {
    "champion": [
      "Iff.intro"
    ],
    "apprentice": [
      "intro hPQ",
      "intro hQP",
      "constructor",
      "exact □",
      "hPQ",
      "exact □",
      "hQP"
    ]
  },
  "13": {
    "champion": [
      "Iff.mp"
    ],
    "apprentice": [
      "intro h",
      "intro hP",
      "apply □",
      "h.mp",
      "exact □",
      "hP"
    ]
  },
  "14": {
    "champion": [
      "fun h => □",
      "(□ □)",
      "□.□",
      "h",
      "right",
      "□.□",
      "h",
      "left"
    ],
    "apprentice": [
      "intro h",
      "apply □",
      "h.right",
      "exact □",
      "h.left"
    ]
  },
  "15": {
    "champion": [
      "fun hPQ => □",
      "fun hnQ => □",
      "fun hP => □",
      "(□ □)",
      "hnQ",
      "(□ □)",
      "hPQ",
      "hP"
    ],
    "apprentice": [
      "intro hPQ",
      "intro hnQ",
      "intro hP",
      "apply □",
      "hnQ",
      "apply □",
      "hPQ",
      "exact □",
      "hP"
    ]
  },
  "16": {
    "champion": [
      "fun hnPQ => □",
      "(□ □)",
      "(□ □)",
      "And.intro",
      "fun hP => □",
      "(□ □)",
      "hnPQ",
      "(□ □)",
      "Or.inl",
      "hP",
      "fun hQ => □",
      "(□ □)",
      "hnPQ",
      "(□ □)",
      "Or.inr",
      "hQ"
    ],
    "apprentice": [
      "intro hnPQ",
      "constructor",
      "intro hP",
      "apply □",
      "hnPQ",
      "left",
      "exact □",
      "hP",
      "intro hQ",
      "apply □",
      "hnPQ",
      "right",
      "exact □",
      "hQ"
    ]
  },
  "17": {
    "champion": [
      "fun hPQR => □",
      "fun hP => □",
      "fun hQ => □",
      "(□ □)",
      "hPQR",
      "(□ □)",
      "(□ □)",
      "And.intro",
      "hP",
      "hQ"
    ],
    "apprentice": [
      "intro hPQR",
      "intro hP",
      "intro hQ",
      "apply □",
      "hPQR",
      "constructor",
      "exact □",
      "hP",
      "exact □",
      "hQ"
    ]
  },
  "18": {
    "champion": [
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "Or.elim",
      "h",
      "fun hP => □",
      "hP",
      "False.elim"
    ],
    "apprentice": [
      "intro h",
      "cases □",
      "h",
      "exact □",
      "hP",
      "exfalso",
      "exact □",
      "hFalse"
    ]
  },
  "19": {
    "champion": [
      "Classical.byContradiction"
    ],
    "apprentice": [
      "intro hnP",
      "by_contra hnP2",
      "apply □",
      "hnP",
      "exact □",
      "hnP2"
    ]
  },
  "20": {
    "champion": [
      "Eq.refl"
    ],
    "apprentice": [
      "intro x",
      "rfl"
    ]
  },
  "21": {
    "champion": [
      "fun hPx => □",
      "(□ □)",
      "hPx",
      "a"
    ],
    "apprentice": [
      "intro hPx",
      "apply □",
      "hPx"
    ]
  },
  "22": {
    "champion": [
      "fun hQx => □",
      "fun hPx => □",
      "fun x => □",
      "(□ □)",
      "(□ □)",
      "hQx",
      "x",
      "(□ □)",
      "hPx",
      "x"
    ],
    "apprentice": [
      "intro hQx",
      "intro hPx",
      "intro x",
      "apply □",
      "hQx",
      "apply □",
      "hPx"
    ]
  },
  "23": {
    "champion": [
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "Exists.intro",
      "a",
      "h"
    ],
    "apprentice": [
      "intro h",
      "use □",
      "a",
      "exact □",
      "h"
    ]
  },
  "24": {
    "champion": [
      "fun h => □",
      "fun hxQ => □",
      "(□ □)",
      "(□ □)",
      "Exists.elim",
      "h",
      "fun a => □",
      "fun h2 => □",
      "(□ □)",
      "(□ □)",
      "hxQ",
      "a",
      "h2"
    ],
    "apprentice": [
      "intro h",
      "intro hxQ",
      "rcases □",
      "h",
      "apply □",
      "hxQ",
      "exact □",
      "x",
      "exact □",
      "hx"
    ]
  },
  "25": {
    "champion": [
      "(□ □)",
      "(□ □)",
      "Exists.intro",
      "0",
      "(□ □)",
      "Eq.refl",
      "0"
    ],
    "apprentice": [
      "use □",
      "0",
      "rfl"
    ]
  },
  "26": {
    "champion": [
      "Eq.symm"
    ],
    "apprentice": [
      "intro h",
      "symm",
      "exact □",
      "h"
    ]
  },
  "27": {
    "champion": [
      "Eq.trans"
    ],
    "apprentice": [
      "intro h",
      "intro h2",
      "trans □",
      "b",
      "exact □",
      "h",
      "exact □",
      "h2"
    ]
  },
  "28": {
    "champion": [
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "f",
      "h"
    ],
    "apprentice": [
      "intro h",
      "congr",
      "exact □",
      "h"
    ]
  },
  "29": {
    "champion": [
      "fun h => □",
      "fun h2 => □",
      "(□ □)",
      "(□ □)",
      "Eq.mp",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "P",
      "h",
      "h2"
    ],
    "apprentice": [
      "intro h",
      "intro h2",
      "rw [← □]",
      "h",
      "exact □",
      "h2"
    ]
  },
  "30": {
    "champion": [
      "fun hPQ => □",
      "fun hQR => □",
      "fun hRS => □",
      "fun hP => □",
      "(□ □)",
      "hRS",
      "(□ □)",
      "hQR",
      "(□ □)",
      "hPQ",
      "hP"
    ],
    "apprentice": [
      "intro hPQ",
      "intro hQR",
      "intro hRS",
      "intro hP",
      "apply □",
      "hRS",
      "apply □",
      "hQR",
      "apply □",
      "hPQ",
      "exact □",
      "hP"
    ]
  },
  "31": {
    "champion": [
      "fun hP => □",
      "fun hQ => □",
      "fun hR => □",
      "(□ □)",
      "(□ □)",
      "And.intro",
      "hP",
      "(□ □)",
      "(□ □)",
      "And.intro",
      "hQ",
      "hR"
    ],
    "apprentice": [
      "intro hP",
      "intro hQ",
      "intro hR",
      "constructor",
      "exact □",
      "hP",
      "constructor",
      "exact □",
      "hQ",
      "exact □",
      "hR"
    ]
  },
  "32": {
    "champion": [
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "Or.elim",
      "h",
      "fun h2 => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "Or.elim",
      "h2",
      "fun hP => □",
      "(□ □)",
      "Or.inr",
      "(□ □)",
      "Or.inr",
      "hP",
      "fun hQ => □",
      "(□ □)",
      "Or.inr",
      "(□ □)",
      "Or.inl",
      "hQ",
      "Or.inl"
    ],
    "apprentice": [
      "intro h",
      "cases □",
      "h",
      "cases □",
      "h2",
      "right",
      "right",
      "exact □",
      "hP",
      "right",
      "left",
      "exact □",
      "hQ",
      "left",
      "exact □",
      "hR"
    ]
  },
  "33": {
    "champion": [
      "fun h => □",
      "fun h2 => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "Or.elim",
      "h2",
      "fun hP => □",
      "(□ □)",
      "Or.inl",
      "(□ □)",
      "□.□",
      "h",
      "mp",
      "hP",
      "Or.inr"
    ],
    "apprentice": [
      "intro h",
      "intro h2",
      "rw [← □]",
      "h",
      "exact □",
      "h2"
    ]
  },
  "34": {
    "champion": [
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "g",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "f",
      "h"
    ],
    "apprentice": [
      "intro h",
      "subst □",
      "b",
      "rfl"
    ]
  },
  "35": {
    "champion": [
      "fun h => □",
      "fun h2 => □",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "f",
      "(□ □)",
      "(□ □)",
      "Eq.trans",
      "h",
      "h2"
    ],
    "apprentice": [
      "intro h",
      "intro h2",
      "calc … = □ := □",
      "f b",
      "congr",
      "exact □",
      "h",
      "congr",
      "exact □",
      "h2"
    ]
  },
  "36": {
    "champion": [
      "(□ □)",
      "Classical.em",
      "P"
    ],
    "apprentice": [
      "by_cases □",
      "P",
      "left",
      "exact □",
      "hP",
      "right",
      "exact □",
      "hnP"
    ]
  },
  "37": {
    "champion": [
      "fun hnP => □",
      "fun hP => □",
      "(□ □)",
      "False.elim",
      "(□ □)",
      "hnP",
      "hP"
    ],
    "apprentice": [
      "intro hnP",
      "intro hP",
      "contradiction"
    ]
  },
  "38": {
    "champion": [
      "Eq.refl"
    ],
    "apprentice": [
      "intro n",
      "rfl"
    ]
  },
  "39": {
    "champion": [
      "fun n => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "Nat.rec",
      "n",
      "(□ □)",
      "Eq.refl",
      "0",
      "fun n2 => □",
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "Nat.succ",
      "h"
    ],
    "apprentice": [
      "intro n",
      "induction □",
      "n",
      "rfl",
      "simp",
      "congr",
      "exact □",
      "ih"
    ]
  },
  "40": {
    "champion": [
      "fun n => □",
      "fun m => □",
      "(□ □)",
      "Eq.refl",
      "Nat.succ (n + m)"
    ],
    "apprentice": [
      "intro n",
      "intro m",
      "rfl"
    ]
  },
  "41": {
    "champion": [
      "fun c => □",
      "fun b => □",
      "fun a => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "Nat.rec",
      "c",
      "(□ □)",
      "Eq.refl",
      "a + b",
      "fun n => □",
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "Nat.succ",
      "h"
    ],
    "apprentice": [
      "intro c",
      "intro b",
      "intro a",
      "induction □",
      "c",
      "rfl",
      "simp",
      "congr",
      "exact □",
      "ih"
    ]
  },
  "42": {
    "champion": [
      "fun a => □",
      "fun b => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "Nat.rec",
      "b",
      "(□ □)",
      "Eq.symm",
      "(□ □)",
      "Nat.zero_add",
      "a",
      "fun n => □",
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "Eq.trans",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "Nat.succ",
      "h",
      "(□ □)",
      "Eq.symm",
      "(□ □)",
      "(□ □)",
      "Nat.succ_add",
      "n",
      "a"
    ],
    "apprentice": [
      "intro a",
      "intro b",
      "induction □",
      "b",
      "simp",
      "rw [□]",
      "Nat.zero_add",
      "rfl",
      "simp",
      "rw [□]",
      "ih",
      "rw [□]",
      "Nat.succ_add",
      "rfl"
    ]
  },
  "43": {
    "champion": [
      "fun xs => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "List.rec",
      "xs",
      "(□ □)",
      "Eq.refl",
      "[]",
      "fun head => □",
      "fun tail => □",
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "List.cons head",
      "h"
    ],
    "apprentice": [
      "intro xs",
      "induction □",
      "xs",
      "rfl",
      "simp",
      "rw [□]",
      "ih",
      "rfl"
    ]
  },
  "44": {
    "champion": [
      "fun xs => □",
      "fun ys => □",
      "fun zs => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "List.rec",
      "xs",
      "(□ □)",
      "Eq.refl",
      "ys ++ zs",
      "fun head => □",
      "fun tail => □",
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "List.cons head",
      "h"
    ],
    "apprentice": [
      "intro xs",
      "intro ys",
      "intro zs",
      "induction □",
      "xs",
      "rfl",
      "simp",
      "rw [□]",
      "ih",
      "rfl"
    ]
  },
  "45": {
    "champion": [
      "fun xs => □",
      "fun ys => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "List.rec",
      "xs",
      "(□ □)",
      "Eq.symm",
      "(□ □)",
      "Nat.zero_add",
      "List.length ys",
      "fun head => □",
      "fun tail => □",
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "Eq.trans",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "Nat.succ",
      "h",
      "(□ □)",
      "Eq.symm",
      "(□ □)",
      "(□ □)",
      "Nat.succ_add",
      "List.length tail",
      "List.length ys"
    ],
    "apprentice": [
      "intro xs",
      "intro ys",
      "induction □",
      "xs",
      "simp",
      "rw [□]",
      "Nat.zero_add",
      "rfl",
      "simp",
      "rw [□]",
      "Nat.succ_add",
      "congr",
      "exact □",
      "ih"
    ]
  },
  "46": {
    "champion": [
      "fun xs => □",
      "fun ys => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "List.rec",
      "xs",
      "(□ □)",
      "Eq.symm",
      "(□ □)",
      "Nat.zero_add",
      "sum ys",
      "fun head => □",
      "fun tail => □",
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "Eq.trans",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "Nat.add head",
      "h",
      "(□ □)",
      "Eq.symm",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "Nat.add_assoc",
      "head",
      "sum tail",
      "sum ys"
    ],
    "apprentice": [
      "intro xs",
      "intro ys",
      "induction □",
      "xs",
      "simp",
      "rw [□]",
      "Nat.zero_add",
      "rfl",
      "simp",
      "rw [□]",
      "ih",
      "rw [← □]",
      "Nat.add_assoc",
      "rfl"
    ]
  },
  "47": {
    "champion": [
      "fun xs => □",
      "fun ys => □",
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "List.Perm.rec",
      "(□ □)",
      "Eq.refl",
      "0",
      "fun x => □",
      "fun l1 => □",
      "fun l2 => □",
      "fun h2 => □",
      "fun h3 => □",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "Nat.add x",
      "h3",
      "fun x => □",
      "fun y => □",
      "fun l => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "Nat.add_left_comm",
      "y",
      "x",
      "sum l",
      "fun l1 => □",
      "fun l2 => □",
      "fun l3 => □",
      "fun h1 => □",
      "fun h2 => □",
      "fun h3 => □",
      "fun h4 => □",
      "(□ □)",
      "(□ □)",
      "Eq.trans",
      "h3",
      "h4",
      "h"
    ],
    "apprentice": [
      "intro xs",
      "intro ys",
      "intro h",
      "induction □",
      "h",
      "simp",
      "simp",
      "rw [□]",
      "ih",
      "rfl",
      "simp",
      "rw [□]",
      "Nat.add_left_comm",
      "rfl",
      "calc … = □ := □",
      "sum l2",
      "exact □",
      "ih1",
      "exact □",
      "ih2"
    ]
  },
  "48": {
    "champion": [
      "fun xs => □",
      "fun ys => □",
      "(□ □)",
      "(□ □)",
      "Eq.trans",
      "(□ □)",
      "(□ □)",
      "sum_append",
      "xs",
      "ys",
      "(□ □)",
      "(□ □)",
      "Eq.trans",
      "(□ □)",
      "(□ □)",
      "Nat.add_comm",
      "sum xs",
      "sum ys",
      "(□ □)",
      "Eq.symm",
      "(□ □)",
      "(□ □)",
      "sum_append",
      "ys",
      "xs"
    ],
    "apprentice": [
      "intro xs",
      "intro ys",
      "rw [□]",
      "sum_append",
      "rw [□]",
      "sum_append",
      "rw [□]",
      "Nat.add_comm",
      "rfl"
    ]
  },
  "49": {
    "champion": [
      "fun n => □",
      "fun x => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "Nat.rec",
      "n",
      "(□ □)",
      "Eq.symm",
      "(□ □)",
      "Nat.zero_mul",
      "x",
      "fun n2 => □",
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "Eq.trans",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "Nat.add x",
      "h",
      "(□ □)",
      "(□ □)",
      "Eq.trans",
      "(□ □)",
      "(□ □)",
      "Nat.add_comm",
      "x",
      "n2 * x",
      "(□ □)",
      "Eq.symm",
      "(□ □)",
      "(□ □)",
      "Nat.succ_mul",
      "n2",
      "x"
    ],
    "apprentice": [
      "intro n",
      "intro x",
      "induction □",
      "n",
      "simp",
      "rw [□]",
      "Nat.zero_mul",
      "rfl",
      "simp",
      "rw [□]",
      "ih",
      "rw [□]",
      "Nat.succ_mul",
      "rw [□]",
      "Nat.add_comm",
      "rfl"
    ]
  },
  "50": {
    "champion": [
      "fun xs => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "List.rec",
      "xs",
      "fun n => □",
      "(□ □)",
      "Eq.refl",
      "0",
      "fun head => □",
      "fun tail => □",
      "fun hatil => □",
      "fun n => □",
      "(□ □)",
      "(□ □)",
      "Eq.trans",
      "(□ □)",
      "(□ □)",
      "sum_append",
      "List.replicate n head",
      "repeatEach n tail",
      "(□ □)",
      "(□ □)",
      "Eq.trans",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "Nat.add (sum (List.replicate n head))",
      "(□ □)",
      "hatil",
      "n",
      "(□ □)",
      "(□ □)",
      "Eq.trans",
      "(□ □)",
      "(□ □)",
      "Nat.add_comm",
      "sum (List.replicate n head)",
      "n * sum tail",
      "(□ □)",
      "(□ □)",
      "Eq.trans",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "Nat.add (n * sum tail)",
      "(□ □)",
      "(□ □)",
      "sum_replicate",
      "n",
      "head",
      "(□ □)",
      "(□ □)",
      "Eq.trans",
      "(□ □)",
      "(□ □)",
      "Nat.add_comm",
      "n * sum tail",
      "n * head",
      "(□ □)",
      "Eq.symm",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "Nat.mul_add",
      "n",
      "head",
      "sum tail"
    ],
    "apprentice": [
      "intro xs",
      "induction □",
      "xs",
      "intro n",
      "simp",
      "intro n",
      "simp",
      "rw [□]",
      "sum_append",
      "rw [□]",
      "sum_replicate",
      "rw [□]",
      "ih",
      "rw [□]",
      "Nat.mul_add",
      "rfl"
    ]
  }
} as const satisfies Record<number, IntendedSelections>;

export function selectionsForLevel(levelId: number): IntendedSelections {
  const tutorialSelections: Readonly<Record<number, IntendedSelections>> = {
    1: { champion: ["0"], apprentice: ["exact □", "0"] },
    2: { champion: ["n"], apprentice: ["exact □", "n"] },
    3: { champion: ["[]"], apprentice: ["exact □", "[]"] },
    4: { champion: ["True"], apprentice: ["exact □", "True"] },
    5: { champion: ["True.intro"], apprentice: ["exact □", "True.intro"] },
  };
  const selections = tutorialSelections[levelId] ??
    (intendedSelections as Readonly<Record<number, IntendedSelections>>)[levelId - 5];
  if (!selections) throw new Error(`Missing intended selections for level ${levelId}`);
  return selections;
}
