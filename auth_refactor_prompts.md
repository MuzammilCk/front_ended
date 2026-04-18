# Hadi Perfumes — Auth Refactor Prompts

> **How to use:** Execute these prompts **in order**, one at a time. Each prompt is self-contained and fixes exactly one problem identified in the [audit](file:///c:/Users/THINKPAD%20L13/Projects/hadi-v1/audit.md). Wait for each to complete and verify before moving to the next.
## Prompt 7 — Implement Inline OTP Step with GSAP Slide Animation

**Audit Reference:** *Phase 3 — Seamless OTP Transition.*

**Problem:** The OTP component currently snaps in abruptly, breaking the premium feel. It should slide in smoothly using GSAP, replacing the form content inline (not as a popup).

**Files to modify:**
- `mlm-app/src/pages/Register.tsx`

**Instructions:**

1. When `step` transitions from `"form"` to `"otp"`, use GSAP to animate the transition:
   - Wrap the form content and the OTP content each in a container `div` with a `ref`.
   - When transitioning to OTP: animate the form container out with `gsap.to(formRef, { x: -50, opacity: 0, duration: 0.3, ease: "power2.in" })`, then in the completion callback, set `step = "otp"` and animate the OTP container in with `gsap.fromTo(otpRef, { x: 50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" })`.

2. When the user clicks "← Change phone number" from the OTP step to go back to the form, reverse the animation: OTP slides out right, form slides in from left.

3. The OTP section should use the same `auth-input-group` styling context. Keep the existing `OTPInput` component (it's well-built), but style its container with the auth design system:
   - Use `auth-input-group` wrapper styling.
   - The "VERIFY OTP" button should use the `auth-btn-primary` class.
   - The resend cooldown and attempt counter should use `text-xs` with `color: var(--text-muted)`.

4. Update the step dots: When on OTP step, show a 4th dot as active (or change the dots to 4 total: Identity → Security → Access Code → Verify).

**Verification:**
- After submitting Step 3, the form smoothly slides left and the OTP input slides in from the right.
- Pressing "← Change phone number" reverses the animation.
- OTP input, verify button, resend timer all render correctly with the new styling.
- The step dots show step 4 as active during OTP.
- Auto-verify on complete (existing `onComplete` behavior) still works.
- No TypeScript errors.

---

## Prompt 8 — Smart Identifier Auto-Format ("Format As They Type")

**Audit Reference:** *Phase 3 — Format As They Type.*

**Problem:** When typing a phone number into the smart identifier field, the numbers should auto-format with spaces for readability (e.g., `+91 98765 43210`). If the user types a letter, it's treated as email and no formatting is applied.

**Files to modify:**
- `mlm-app/src/components/Login-components/LoginForm.tsx`
- `mlm-app/src/components/Register-components/RegisterForm.tsx` (the phone input in Step 1)

**Instructions:**

1. Create a utility function (can be inline or in a shared utils file) that detects and formats phone input:

   ```ts
   function formatSmartIdentifier(raw: string): string {
     // If input starts with a letter or contains @, it's an email — don't format
     if (/[a-zA-Z@]/.test(raw)) return raw;
     
     // Strip everything except digits and the leading +
     const cleaned = raw.replace(/[^\d+]/g, "");
     
     // Format with spaces for readability
     if (cleaned.startsWith("+91") && cleaned.length > 3) {
       const digits = cleaned.slice(3);
       const part1 = digits.slice(0, 5);
       const part2 = digits.slice(5, 10);
       return `+91 ${part1}${part2 ? " " + part2 : ""}`;
     }
     
     return cleaned;
   }
   ```

2. In `LoginForm.tsx`, wrap the `handleChange` for the identifier input:
   - On each keystroke, if the value looks like a phone number (starts with digit or `+`), apply the format function.
   - Store the **raw** (unformatted) value in state for submission, but display the **formatted** value in the input.
   - The simplest approach: have a local `displayValue` state that shows the formatted version, and on submit, strip all spaces before sending.

3. In the Register form's Step 1 phone input, apply the same formatting.

4. **Important:** When submitting, always strip spaces from the identifier before sending to the API:
   ```ts
   const submitIdentifier = formData.identifier.replace(/\s/g, "");
   ```

**Verification:**
- Typing `9876543210` into the login identifier field shows `+91 98765 43210`.
- Typing `test@example.com` shows the email as-is, no formatting.
- Typing `+1234567890` shows `+1234567890` (non-Indian numbers don't get special formatting, just cleaned).
- The actual value sent to the API is the clean version without spaces.
- No TypeScript errors.

---

## Prompt 9 — Keyboard Trapping & Auto-Focus (Accessibility UX)

**Audit Reference:** *Phase 3 — Keyboard Trapping & Auto-focus.*

**Problem:** When the user lands on the login page, the first input should be auto-focused. Pressing Enter should submit the form or move to the next input.

**Files to modify:**
- `mlm-app/src/components/Login-components/LoginForm.tsx`
- `mlm-app/src/components/Register-components/RegisterForm.tsx`

**Instructions:**

1. In `LoginForm.tsx`:
   - The identifier input already has `autoFocus` (added in Prompt 5). Verify it works.
   - Add `onKeyDown` handler to the identifier input: if the user presses Enter and the identifier is filled, focus the password input (use a `ref` on the password input).
   - The password input's Enter key already triggers form submit via the `<form onSubmit>` — this is correct.

2. In `RegisterForm.tsx`:
   - Step 1: Auto-focus the Full Name input on mount.
   - Step 1: Enter on Full Name → focuses Phone. Enter on Phone → clicks "Continue" (calls `onNextStep`).
   - Step 2: Auto-focus the Password input on step mount.
   - Step 2: Enter on Confirm Password → clicks "Continue" if valid.
   - Step 3: Auto-focus the Atelier Access Code input on step mount.
   - Step 3: Enter on the input → clicks "Create Account" submit.

3. Use `useEffect` with step dependencies to auto-focus the first input of each step:
   ```ts
   useEffect(() => {
     const input = document.getElementById(`register-step-${currentStep}-first`);
     if (input) input.focus();
   }, [currentStep]);
   ```
   Add corresponding `id` attributes to the first input of each step.

**Verification:**
- Landing on `/login` puts the cursor in the identifier field immediately.
- Pressing Enter in the identifier field moves focus to the password field.
- Pressing Enter in the password field submits the form.
- On the register page, the first input of each step auto-focuses when navigating between steps.
- Enter key navigation works through each registration step.

---

## Prompt 10 — Consolidated Error Handling with Animated Toast

**Audit Reference:** *Phase 3 — Consolidated Error Handling.*

**Problem:** Currently, errors show as inline red text under individual inputs (e.g., "Passwords do not match" under the confirm password field). The MNC pattern is to consolidate errors into a single elegant top-anchored alert box with a vibrating shake animation.

**Files to modify:**
- `mlm-app/src/pages/Login.tsx` (already using `auth-error-toast` from Prompt 5)
- `mlm-app/src/pages/Register.tsx`
- `mlm-app/src/components/Register-components/RegisterForm.tsx`

**Instructions:**

1. The `auth-error-toast` CSS class in `Auth.css` already includes the shake animation. Verify it's being used in `Login.tsx` (from Prompt 5).

2. In `Register.tsx`, replace the `<Alert variant="error">` usage with the `auth-error-toast` div:
   ```tsx
   {apiError && (
     <div className="auth-error-toast" key={apiError}>
       {apiError}
       {showLoginRedirect && (
         <span className="block mt-1 text-xs">
           Redirecting to login page…{" "}
           <Link to="/login" className="underline text-[#c9a96e]">Go now</Link>
         </span>
       )}
     </div>
   )}
   ```
   The `key={apiError}` ensures the shake animation replays when the error message changes.

3. In `RegisterForm.tsx`:
   - Remove the inline "Passwords do not match" error text under the confirm password field (around line 215–217).
   - Instead, when the user tries to proceed from Step 2 with mismatched passwords, set the parent's `apiError` state with the message "Passwords do not match." (this requires passing a `setApiError` prop or having the step validation in the parent).
   - Move all validation messages to the parent component's consolidated error toast.

4. Remove the `<Alert>` component import from `Register.tsx` — it's no longer needed for auth pages.

**Verification:**
- All errors on Login and Register pages appear in a single top-anchored toast with a shake animation.
- No inline red text under individual inputs.
- The shake animation replays when error messages change.
- Import of `Alert` component is removed from auth pages (it can still exist for other pages).
- No TypeScript errors.

---

## Prompt 11 — "Slow Reveal" Image Animation & Page Load Micro-Interactions

**Audit Reference:** *Phase 3 — The "Slow Reveal" Image Load + All micro-interactions.*

**Problem:** The page needs to feel "incredibly expensive" on load. The right-side form should fade in instantly (0.2s) while the left-side editorial image slowly scales from 1.1 to 1.0 over 2 seconds.

**Files to modify:**
- `mlm-app/src/pages/Login.tsx` (verify existing GSAP from Prompt 5)
- `mlm-app/src/pages/Register.tsx` (add matching animations)

**Instructions:**

1. **Verify Login.tsx** already has these animations from Prompt 5:
   - Image: `gsap.to(imageRef, { scale: 1, duration: 2, ease: "power2.out" })`
   - Form panel: `gsap.fromTo(formRef, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 })`

2. **Add the same animations to Register.tsx:**
   - Add `useRef` for the editorial image and form panel.
   - In a `useEffect` on mount, run the same GSAP animations.
   - The form panel should start with `opacity: 0` in inline style and animate in.

3. **Add the Sign In button cross-fade micro-interaction:**
   In `LoginForm.tsx`, the button already shows a spinner when loading (from Prompt 5). Enhance it by wrapping the text and spinner in a container that cross-fades:
   ```tsx
   <button type="submit" disabled={isLoading} className="auth-btn-primary">
     <span style={{
       opacity: isLoading ? 0 : 1,
       transition: "opacity 0.2s ease",
       position: isLoading ? "absolute" : "static"
     }}>
       Sign In
     </span>
     {isLoading && <div className="auth-btn-spinner" />}
   </button>
   ```

4. **Apply the same to Register's "Create Account" button** (Step 3 submit button).

**Verification:**
- On page load, the editorial image slowly zooms from 1.1 to 1.0 (2s).
- The form fades in quickly (0.2–0.5s).
- Clicking "Sign In" cross-fades the text into a spinner smoothly.
- Same animations work on the Register page.
- Looks premium and "expensive" on load.

---

## Prompt 12 — Clean Up Unused Files & Dead Imports

**Problem:** After all the refactoring, several files and imports are no longer needed. Clean up the codebase.

**Files to delete:**
- `mlm-app/src/components/Login-components/LoginMethodToggle.tsx` (replaced by smart identifier)
- `mlm-app/src/components/Login-components/LoginHero.tsx` (inlined into Login.tsx)
- `mlm-app/src/components/Login-components/LoginHeader.tsx` (inlined into Login.tsx split layout)
- `mlm-app/src/components/Login-components/LoginFooter.tsx` (inlined into Login.tsx split layout)
- `mlm-app/src/components/Register-components/RegisterHero.tsx` (inlined into Register.tsx)
- `mlm-app/src/components/Register-components/RegisterHeader.tsx` (inlined into Register.tsx)
- `mlm-app/src/components/Register-components/RegisterFooter.tsx` (inlined into Register.tsx)

**Files to verify (ensure no dead imports):**
- `mlm-app/src/pages/Login.tsx` — should NOT import: LoginHero, LoginMethodToggle, LoginHeader, LoginFooter, Alert (for auth), useCart (if unused).
- `mlm-app/src/pages/Register.tsx` — should NOT import: RegisterHero, RegisterHeader, RegisterFooter, Alert (for auth), useCart (if unused).

**Instructions:**

1. Delete each file listed above.
2. Run a search across the entire `src/` directory for any remaining imports of these deleted files. If found, remove those import lines.
3. Run `npm run build` (or the TypeScript compiler) to verify there are no broken imports or type errors.

**Verification:**
- All listed files are deleted.
- No import references to deleted files exist anywhere in `src/`.
- `npm run build` or `npx tsc --noEmit` completes with zero errors.
- Login and Register pages render correctly in the browser.

---

---

## AI Image Generation Prompt — Editorial Left Panel

> [!IMPORTANT]
> Use this prompt to generate the luxury editorial image for the left side of the split layout. Save the output as `/assets/auth-editorial.webp` and update both `Login.tsx` and `Register.tsx` to reference it instead of `auth-bg.webp`.

**Prompt for Image Generation (DALL-E 3 / Midjourney v6):**

> *High-end editorial commercial photography, split-screen layout left panel image. A luxurious, minimalist glass perfume bottle resting on a raw piece of dark textured slate. The bottle contains rich, golden-amber liquid. Dramatic chiaroscuro lighting, deep shadows, soft golden volumetric backlighting illuminating the liquid from behind. Scattered around the base are raw ingredients: a single Madagascar vanilla bean pod and a piece of textured agarwood (oud). Dark, moody aesthetic, #0a0705 background color, extreme macro detail, 8k resolution, shot on medium format camera, Vogue magazine style, negative space at the top for typography. --ar 4:5 --style raw --v 6.0*

**Usage:** After generating, place the image at `mlm-app/public/assets/auth-editorial.webp`. Then update both auth pages to use `src="/assets/auth-editorial.webp"` on the editorial image elements.

---

## Execution Summary

| # | Prompt | Problem Fixed | Files Touched |
|---|--------|--------------|---------------|
| 1 | Remove "Continue as Guest" | Anti-pattern button in auth hub | Login.tsx, Register.tsx |
| 2 | Smart Identifier Input | Clunky email/phone toggle | Login.tsx, LoginForm.tsx, ~~LoginMethodToggle.tsx~~ |
| 3 | Atelier Access Code | Transactional referral framing | RegisterForm.tsx, Register.tsx |
| 4 | Auth CSS Foundation | No design system for auth | **NEW** Auth.css, index.css |
| 5 | Split Layout Login | Glassmorphism + contrast failures | Login.tsx, LoginForm.tsx, ~~LoginHero.tsx~~ |
| 6 | Progressive Registration | Cognitive overload (7 fields) | Register.tsx, RegisterForm.tsx, ~~RegisterHero.tsx~~ |
| 7 | Inline OTP Animation | Abrupt OTP snap-in | Register.tsx |
| 8 | Auto-Format Phone | No live formatting | LoginForm.tsx, RegisterForm.tsx |
| 9 | Keyboard Trapping | No auto-focus or Enter navigation | LoginForm.tsx, RegisterForm.tsx |
| 10 | Consolidated Errors | Scattered inline error text | Login.tsx, Register.tsx, RegisterForm.tsx |
| 11 | Slow Reveal Animation | No premium page load feel | Login.tsx, Register.tsx |
| 12 | Cleanup Dead Files | Unused files & imports | 7 files deleted, imports cleaned |
