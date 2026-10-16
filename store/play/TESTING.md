# Google Play closed test: the path to production for a personal account

## The rule (read 2026-09-24, https://support.google.com/googleplay/android-developer/answer/14151465)

- It applies to "personal developer accounts created after November 13, 2023". Josh's new account will be one.
- You need "a minimum of 12 testers who have been opted in continuously for at least 14 days". The 14 days "must be consecutive". "Testers who opt in, test for fewer than 14 days, and then opt out do not count."
- Then: Play Console ▸ Dashboard ▸ **Apply for production**. "Review usually takes seven days or less, but can occasionally take longer."
- If refused: "you may need to continue running your closed test. Reasons … include having fewer than 12 opted-in testers or insufficient tester engagement."

**Plan for 15 or more testers**, so that one or two dropping out does not restart the clock. The earliest production date is the 14th full day after the 12th tester opts in, plus the review (up to 7 days).

## Setting up the closed track (read 2026-09-24, https://support.google.com/googleplay/android-developer/answer/9845334)

1. Finish the app setup first: store listing, Data safety, content rating, target audience and privacy URL (all in `LISTING.md`). Closed testing opens only after that.
2. **Test and release ▸ Testing ▸ Closed testing ▸ Manage track** (or create a track and give it a name, e.g. `closed-alpha`).
3. **Testers** tab: create an e-mail list (up to 2,000 addresses per list), or give a Google Group (`name@googlegroups.com`). A Google Group lets testers join without Josh typing each address.
4. Set the **feedback URL or e-mail** that testers see, and copy the **opt-in link**.
5. **Create release**: upload `tools/platform/android/out/app-release-bundle.aab`, built after the `minSdk` decision (31 = Android 12, the WebGPU floor). Add release notes and roll it out to the closed track.
6. Send each tester the opt-in link. They must accept it **with the Google account on the list**, then install from the Play link on an Android 12+ phone.

## What to send testers (paste and adjust)

> Thanks for testing λWAVES. It's a real-time quantum-wave instrument that runs on your phone's GPU.
>
> 1. Open this link **with the Google account I added**: `<opt-in link>`. Tap "Become a tester", then install from Google Play.
> 2. You need Android 12 or newer and a recent Chrome. If you see a "WebGPU" notice instead of the lab, tell me your phone model. That result is useful too.
> 3. **Stay opted in and keep the app installed for at least 14 days.** Google counts only testers who stay the whole time.
> 4. A few times over the two weeks, open it for a couple of minutes:
>    - press play and drag the wave;
>    - try DEMOS ▸ WAVE DANCER (in the notebook's projects);
>    - switch on a molecule.
> 5. Send anything odd (a crash, a blank screen, slowness, a confusing control) to `<josh's public contact>`, with your phone model and a screenshot if you can.
>
> Nothing you do in the app is collected. There is no account and no analytics, so your messages are the only feedback I get.

Keep a simple log of who joined when, their phone and Android version, and what they reported. The production application asks for exactly that.

## The production-access application (same page, three parts)

1. **About your closed test**
   - how easy it was to recruit testers;
   - engagement: whether testers "used all available app features" and whether "tester usage matched expected production user behavior";
   - a summary of the feedback and "how feedback was collected".
2. **About your app**
   - "the target audience": people aged 13+ who are curious about physics and chemistry, plus students and teachers;
   - "how your app provides value to users": an exact, playable view of quantum states on a phone, with no account and nothing collected;
   - "an estimated install range … during its first year": Josh's estimate.
3. **About your production readiness**
   - "any changes made … based on what you learned from your closed test" (from the log above);
   - "how you determined that your app … was ready for production", e.g. the P06 device rows in `docs/ACCEPTANCE-MATRIX.md` and zero open crash reports.

Draft these answers from the tester log as the 14 days run, not on day 15.
