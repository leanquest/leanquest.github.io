export type IntendedSelections = { warrior: readonly string[]; mage: readonly string[] };

export const intendedSelections = {
  "1": {
    "warrior": [
      "hp"
    ],
    "mage": [
      "exact □",
      "hp"
    ]
  },
  "2": {
    "warrior": [
      "fun hP => □",
      "hP"
    ],
    "mage": [
      "intro hP",
      "exact □",
      "hP"
    ]
  },
  "3": {
    "warrior": [
      "fun hP => □",
      "fun hQ => □",
      "hP"
    ],
    "mage": [
      "intro hP",
      "intro hQ",
      "exact □",
      "hP"
    ]
  },
  "4": {
    "warrior": [
      "fun hP => □",
      "fun hPQ => □",
      "(□ □)",
      "hPQ",
      "hP"
    ],
    "mage": [
      "intro hP",
      "intro hPQ",
      "apply □",
      "hPQ",
      "exact □",
      "hP"
    ]
  },
  "5": {
    "warrior": [
      "fun hPQ => □",
      "fun hQR => □",
      "fun hP => □",
      "(□ □)",
      "hQR",
      "(□ □)",
      "hPQ",
      "hP"
    ],
    "mage": [
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
    "warrior": [
      "And.intro"
    ],
    "mage": [
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
    "warrior": [
      "And.left"
    ],
    "mage": [
      "intro h",
      "apply □",
      "And.left",
      "exact □",
      "h"
    ]
  },
  "8": {
    "warrior": [
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
    "mage": [
      "intro h",
      "constructor",
      "exact □",
      "h.right",
      "exact □",
      "h.left"
    ]
  },
  "9": {
    "warrior": [
      "Or.inl"
    ],
    "mage": [
      "intro hP",
      "left",
      "exact □",
      "hP"
    ]
  },
  "10": {
    "warrior": [
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
    "mage": [
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
    "warrior": [
      "False.elim"
    ],
    "mage": [
      "intro hFalse",
      "exfalso",
      "exact □",
      "hFalse"
    ]
  },
  "12": {
    "warrior": [
      "Iff.intro"
    ],
    "mage": [
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
    "warrior": [
      "Iff.mp"
    ],
    "mage": [
      "intro h",
      "intro hP",
      "apply □",
      "h.mp",
      "exact □",
      "hP"
    ]
  },
  "14": {
    "warrior": [
      "fun h => □",
      "(□ □)",
      "□.□",
      "h",
      "right",
      "□.□",
      "h",
      "left"
    ],
    "mage": [
      "intro h",
      "apply □",
      "h.right",
      "exact □",
      "h.left"
    ]
  },
  "15": {
    "warrior": [
      "fun hPQ => □",
      "fun hnQ => □",
      "fun hP => □",
      "(□ □)",
      "hnQ",
      "(□ □)",
      "hPQ",
      "hP"
    ],
    "mage": [
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
    "warrior": [
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
    "mage": [
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
    "warrior": [
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
    "mage": [
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
    "warrior": [
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
    "mage": [
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
    "warrior": [
      "Classical.byContradiction"
    ],
    "mage": [
      "intro hnP",
      "by_contra hnP2",
      "apply □",
      "hnP",
      "exact □",
      "hnP2"
    ]
  },
  "20": {
    "warrior": [
      "Eq.refl"
    ],
    "mage": [
      "intro x",
      "rfl"
    ]
  },
  "21": {
    "warrior": [
      "fun hPx => □",
      "(□ □)",
      "hPx",
      "a"
    ],
    "mage": [
      "intro hPx",
      "apply □",
      "hPx"
    ]
  },
  "22": {
    "warrior": [
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
    "mage": [
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
    "warrior": [
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "Exists.intro",
      "a",
      "h"
    ],
    "mage": [
      "intro h",
      "use □",
      "a",
      "exact □",
      "h"
    ]
  },
  "24": {
    "warrior": [
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
    "mage": [
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
    "warrior": [
      "(□ □)",
      "(□ □)",
      "Exists.intro",
      "0",
      "(□ □)",
      "Eq.refl",
      "0"
    ],
    "mage": [
      "use □",
      "0",
      "rfl"
    ]
  },
  "26": {
    "warrior": [
      "Eq.symm"
    ],
    "mage": [
      "intro h",
      "symm",
      "exact □",
      "h"
    ]
  },
  "27": {
    "warrior": [
      "Eq.trans"
    ],
    "mage": [
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
    "warrior": [
      "fun h => □",
      "(□ □)",
      "(□ □)",
      "congrArg",
      "f",
      "h"
    ],
    "mage": [
      "intro h",
      "congr",
      "exact □",
      "h"
    ]
  },
  "29": {
    "warrior": [
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
    "mage": [
      "intro h",
      "intro h2",
      "rw [← □]",
      "h",
      "exact □",
      "h2"
    ]
  },
  "30": {
    "warrior": [
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
    "mage": [
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
    "warrior": [
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
    "mage": [
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
    "warrior": [
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
    "mage": [
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
    "warrior": [
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
    "mage": [
      "intro h",
      "intro h2",
      "rw [← □]",
      "h",
      "exact □",
      "h2"
    ]
  },
  "34": {
    "warrior": [
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
    "mage": [
      "intro h",
      "subst □",
      "b",
      "rfl"
    ]
  },
  "35": {
    "warrior": [
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
    "mage": [
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
    "warrior": [
      "(□ □)",
      "Classical.em",
      "P"
    ],
    "mage": [
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
    "warrior": [
      "fun hnP => □",
      "fun hP => □",
      "(□ □)",
      "False.elim",
      "(□ □)",
      "hnP",
      "hP"
    ],
    "mage": [
      "intro hnP",
      "intro hP",
      "contradiction"
    ]
  },
  "38": {
    "warrior": [
      "Eq.refl"
    ],
    "mage": [
      "intro n",
      "rfl"
    ]
  },
  "39": {
    "warrior": [
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
    "mage": [
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
    "warrior": [
      "fun n => □",
      "fun m => □",
      "(□ □)",
      "Eq.refl",
      "Nat.succ (n + m)"
    ],
    "mage": [
      "intro n",
      "intro m",
      "rfl"
    ]
  },
  "41": {
    "warrior": [
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
    "mage": [
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
    "warrior": [
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
    "mage": [
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
    "warrior": [
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
    "mage": [
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
    "warrior": [
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
    "mage": [
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
    "warrior": [
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
    "mage": [
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
    "warrior": [
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
    "mage": [
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
    "warrior": [
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
    "mage": [
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
    "warrior": [
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
    "mage": [
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
    "warrior": [
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
    "mage": [
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
    "warrior": [
      "fun xs => □",
      "(□ □)",
      "(□ □)",
      "(□ □)",
      "List.rec",
      "xs",
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
      "h",
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
    "mage": [
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
    1: { warrior: ["0"], mage: ["exact □", "0"] },
    2: { warrior: ["n"], mage: ["exact □", "n"] },
    3: { warrior: ["[]"], mage: ["exact □", "[]"] },
    4: { warrior: ["True"], mage: ["exact □", "True"] },
    5: { warrior: ["True.intro"], mage: ["exact □", "True.intro"] },
  };
  const selections = tutorialSelections[levelId] ??
    (intendedSelections as Readonly<Record<number, IntendedSelections>>)[levelId - 5];
  if (!selections) throw new Error(`Missing intended selections for level ${levelId}`);
  return selections;
}
