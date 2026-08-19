-- LeanQuest curriculum smoke checks.
-- These examples cover the advanced terms and tactics used by the static game data.

example {P : Prop} (hp : P) : P :=
  hp

example {P : Prop} (hp : P) : P := by
  exact hp

example {P : Prop} : ¬¬P → P :=
  fun hnnP => Classical.byContradiction (fun hnP => hnnP hnP)

example {α : Type} {P : α → Prop} {a b : α} : a = b → P a → P b :=
  fun hab hPa => Eq.mp (congrArg P hab) hPa

example : ∀ n : Nat, 0 + n = n :=
  fun n =>
    Nat.rec
      (motive := fun n => 0 + n = n)
      (Eq.refl 0)
      (fun k ih => congrArg Nat.succ ih)
      n

example : ∀ a b c : Nat, (a + b) + c = a + (b + c) :=
  fun a b c =>
    Nat.rec
      (motive := fun c => (a + b) + c = a + (b + c))
      (Eq.refl ((a + b) + 0))
      (fun k ih => congrArg Nat.succ ih)
      c

example : ∀ a b : Nat, a + b = b + a :=
  fun a b =>
    Nat.rec
      (motive := fun b => a + b = b + a)
      (Eq.symm (Nat.zero_add a))
      (fun k ih =>
        Eq.trans (congrArg Nat.succ ih) (Eq.symm (Nat.succ_add k a)))
      b

example {α : Type} : ∀ xs : List α, xs ++ [] = xs :=
  fun xs =>
    List.rec
      (motive := fun xs => xs ++ [] = xs)
      (Eq.refl [])
      (fun x xs ih => congrArg (List.cons x) ih)
      xs

example {α : Type} : ∀ xs ys zs : List α, (xs ++ ys) ++ zs = xs ++ (ys ++ zs) :=
  fun xs ys zs =>
    List.rec
      (motive := fun xs => (xs ++ ys) ++ zs = xs ++ (ys ++ zs))
      (Eq.refl (ys ++ zs))
      (fun x xs ih => congrArg (List.cons x) ih)
      xs

example {α : Type} : ∀ xs ys : List α, (xs ++ ys).length = xs.length + ys.length :=
  fun xs ys =>
    List.rec
      (motive := fun xs => (xs ++ ys).length = xs.length + ys.length)
      (Eq.symm (Nat.zero_add ys.length))
      (fun _ xs ih =>
        Eq.trans (congrArg Nat.succ ih) (Eq.symm (Nat.succ_add xs.length ys.length)))
      xs

def sum : List Nat → Nat
  | [] => 0
  | x :: xs => x + sum xs

private theorem sum_append : ∀ xs ys : List Nat, sum (xs ++ ys) = sum xs + sum ys :=
  fun xs ys =>
    List.rec
      (motive := fun xs => sum (xs ++ ys) = sum xs + sum ys)
      (Eq.symm (Nat.zero_add (sum ys)))
      (fun x xs ih =>
        Eq.trans
          (congrArg (Nat.add x) ih)
          (Eq.symm (Nat.add_assoc x (sum xs) (sum ys))))
      xs

example : ∀ xs ys : List Nat, List.Perm xs ys → sum xs = sum ys :=
  fun _ _ h =>
    List.Perm.rec
      (motive := fun xs ys _ => sum xs = sum ys)
      (Eq.refl 0)
      (fun x _ _ _ ih => congrArg (Nat.add x) ih)
      (fun x y l => Nat.add_left_comm y x (sum l))
      (fun _ _ ih₁ ih₂ => Eq.trans ih₁ ih₂)
      h

example : ∀ xs ys : List Nat, sum (xs ++ ys) = sum (ys ++ xs) :=
  fun xs ys =>
    Eq.trans (sum_append xs ys)
      (Eq.trans (Nat.add_comm (sum xs) (sum ys)) (Eq.symm (sum_append ys xs)))

example : ∀ n x : Nat, sum (List.replicate n x) = n * x :=
  fun n x =>
    Nat.rec
      (motive := fun n => sum (List.replicate n x) = n * x)
      (Eq.symm (Nat.zero_mul x))
      (fun n ih =>
        Eq.trans
          (congrArg (Nat.add x) ih)
          (Eq.trans (Nat.add_comm x (n * x)) (Eq.symm (Nat.succ_mul n x))))
      n

example : ∀ xs : List Nat, ∀ n x : Nat,
    sum (xs ++ List.replicate n x) = sum xs + n * x :=
  fun xs n x =>
    Eq.trans
      (sum_append xs (List.replicate n x))
      (congrArg (Nat.add (sum xs))
        (Nat.rec
          (motive := fun n => sum (List.replicate n x) = n * x)
          (Eq.symm (Nat.zero_mul x))
          (fun n ih =>
            Eq.trans
              (congrArg (Nat.add x) ih)
              (Eq.trans (Nat.add_comm x (n * x)) (Eq.symm (Nat.succ_mul n x))))
          n))

example : ∀ xs ys : List Nat, sum (xs ++ ys) = sum xs + sum ys := by
  intro xs ys
  induction xs with
  | nil => simp [sum]
  | cons x xs ih => simp [sum, ih, Nat.add_assoc]

example : ∀ xs ys : List Nat, List.Perm xs ys → sum xs = sum ys := by
  intro xs ys h
  induction h <;> simp_all [sum, Nat.add_left_comm]

example : ∀ xs ys : List Nat, sum (xs ++ ys) = sum (ys ++ xs) := by
  intro xs ys
  simp [sum_append, Nat.add_comm]

example : ∀ n x : Nat, sum (List.replicate n x) = n * x := by
  intro n x
  induction n with
  | zero => simp [sum]
  | succ n ih => simp [List.replicate_succ, sum, ih, Nat.succ_mul, Nat.add_comm]

example : ∀ xs : List Nat, ∀ n x : Nat,
    sum (xs ++ List.replicate n x) = sum xs + n * x := by
  intro xs
  induction xs with
  | nil =>
    intro n x
    induction n with
    | zero => simp [sum]
    | succ n ih =>
      simpa [List.replicate_succ, sum, Nat.succ_mul, Nat.add_comm] using ih
  | cons y ys ih =>
    intro n x
    simp [sum, ih, Nat.add_assoc]

example : ∀ n : Nat, 0 + n = n := by
  intro n
  induction n with
  | zero => rfl
  | succ n ih => simp [ih]

example : ∀ a b c : Nat, (a + b) + c = a + (b + c) := by
  intro a b c
  induction c with
  | zero => rfl
  | succ c ih => exact congrArg Nat.succ ih

example : ∀ a b : Nat, a + b = b + a := by
  intro a b
  induction b with
  | zero => simp
  | succ b ih =>
      exact Eq.trans (congrArg Nat.succ ih) (Eq.symm (Nat.succ_add b a))

example {α : Type} : ∀ xs : List α, xs ++ [] = xs := by
  intro xs
  induction xs with
  | nil => rfl
  | cons x xs ih => simp [ih]

example {α : Type} : ∀ xs ys zs : List α, (xs ++ ys) ++ zs = xs ++ (ys ++ zs) := by
  intro xs ys zs
  induction xs with
  | nil => rfl
  | cons x xs ih => simp [ih]

example {α : Type} : ∀ xs ys : List α, (xs ++ ys).length = xs.length + ys.length := by
  intro xs ys
  induction xs with
  | nil => simp
  | cons x xs ih => simp [Nat.succ_add, ih]
