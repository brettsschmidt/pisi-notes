// Pisi the Black Cat — Bandit-from-Bluey energy.
// Aussie dad, warm, playful, never saccharine. Lines are short on purpose
// (speech bubble), and we vary cadence so the rotation never feels canned.

export type MascotMood =
  | "happy"
  | "cheer"
  | "thinking"
  | "sleepy"
  | "sad"
  | "neutral";

export type MascotEvent =
  | "greeting"
  | "noteSaved"
  | "noteSavedShort"
  | "noteSavedLong"
  | "taskAdded"
  | "taskDone"
  | "taskUndone"
  | "manyTasksDone"
  | "tagFilter"
  | "search"
  | "searchEmpty"
  | "emptyTimeline"
  | "idle"
  | "signin"
  | "noteEdited"
  | "noteDeleted"
  | "noteArchived"
  | "noteUnarchived";

export interface MascotLine {
  text: string;
  mood: MascotMood;
}

export const MASCOT_DIALOG: Record<MascotEvent, MascotLine[]> = {
  greeting: [
    { text: "G'day, mate! Reckon we get one down before lunch?", mood: "happy" },
    { text: "Oi oi oi! Pisi reporting for duty.", mood: "cheer" },
    { text: "Right-o, what're we putting on the page today?", mood: "happy" },
    { text: "Look at you, showing up. That's already half the battle.", mood: "happy" },
    { text: "Hello, friend. Brain go zoom zoom?", mood: "happy" },
    { text: "Top of the morning, you absolute legend.", mood: "happy" },
    { text: "Ay! Got a thought rattling around? Let's catch it.", mood: "thinking" },
    { text: "Pisi's here. Bring the chaos.", mood: "cheer" },
    { text: "Welcome back, sport. Missed ya.", mood: "happy" },
    { text: "Cup of tea, write a thing, move on with your day.", mood: "happy" },
    { text: "Right. What're we conjuring up, hey?", mood: "thinking" },
    { text: "The page is patient. So am I. Mostly.", mood: "happy" },
    { text: "Pisi loaded. Engines warm. Whenever you're ready.", mood: "cheer" },
    { text: "Here for ya, mate. As always.", mood: "happy" },
  ],
  noteSaved: [
    { text: "Wakka doo! Look at that note, beautiful.", mood: "cheer" },
    { text: "Crikey, that's a goodie. Saved her down.", mood: "happy" },
    { text: "Bonzer. One more for the pile.", mood: "happy" },
    { text: "That's the stuff, mate. Keep 'em coming.", mood: "cheer" },
    { text: "Filed under 'good thinking'. Nice work.", mood: "happy" },
    { text: "Reckon that's worth a little dance.", mood: "cheer" },
    { text: "Boom. Brain → page → bank.", mood: "cheer" },
    { text: "Ah, a beauty. I'll keep it safe for ya.", mood: "happy" },
    { text: "Tidy. Got it, written it, moved on.", mood: "happy" },
    { text: "That one's a keeper, ay?", mood: "happy" },
    { text: "Right? I love that for us.", mood: "cheer" },
    { text: "Ace. You're cookin' with gas now.", mood: "cheer" },
    { text: "Don't mind if I purr a bit. Good note.", mood: "happy" },
    { text: "Yes mate, yes. Smashed it.", mood: "cheer" },
    { text: "That's the trick — get it down before it gets away.", mood: "happy" },
    { text: "Banger. Truly.", mood: "cheer" },
    { text: "I'm not crying, you're crying. Lovely note.", mood: "happy" },
    { text: "Saved her. Tucked her in. All good.", mood: "happy" },
    { text: "Bossing it. Truly.", mood: "cheer" },
    { text: "Caught it before it floated off. Ten outta ten.", mood: "happy" },
    { text: "Lockin' that thought down like a dingo on a sausage.", mood: "cheer" },
    { text: "There it is. There it goes — into the vault.", mood: "happy" },
    { text: "Cute lil note. Approved by Pisi.", mood: "happy" },
    { text: "Smashing. Onwards.", mood: "happy" },
    { text: "Brain's a sieve, mate, but you got it.", mood: "happy" },
    { text: "Reckon that one'll come in handy. Trust the cat.", mood: "thinking" },
    { text: "Tucked into the timeline like a sleeping kid.", mood: "happy" },
    { text: "Excellent. Just brilliant. Gold star.", mood: "cheer" },
  ],
  noteSavedShort: [
    { text: "Short and sweet. Best kind.", mood: "happy" },
    { text: "Tiny note, big energy.", mood: "cheer" },
    { text: "Two words? Massive respect.", mood: "happy" },
    { text: "Brevity, mate. Chef's kiss.", mood: "happy" },
    { text: "One liner — gold.", mood: "happy" },
  ],
  noteSavedLong: [
    { text: "Strewth, that's a chapter. Bravo.", mood: "cheer" },
    { text: "You wrote a whole essay! Good on ya.", mood: "happy" },
    { text: "That's a thought-train and a half.", mood: "happy" },
    { text: "Big one. Have a sit-down after that.", mood: "happy" },
    { text: "Fair dinkum, you brought the words.", mood: "cheer" },
  ],
  taskAdded: [
    { text: "Ooh, a task! I'll keep an eye on this one.", mood: "thinking" },
    { text: "Right. Future-you will love past-you for this.", mood: "happy" },
    { text: "Filed. We'll knock it over later, ay?", mood: "happy" },
    { text: "A new mission. Pisi accepts.", mood: "cheer" },
    { text: "Gotcha. Don't forget the snacks.", mood: "happy" },
    { text: "Plan first, panic later. Love it.", mood: "happy" },
    { text: "Look at you, being all organised.", mood: "happy" },
    { text: "On the list, mate. On the list.", mood: "thinking" },
    { text: "I see what you did there. Sneaky little checkbox.", mood: "cheer" },
    { text: "Tidy. Future-Brett's gonna thank ya.", mood: "happy" },
    { text: "Checkbox spotted. Pisi pounces.", mood: "cheer" },
    { text: "I'll guard this one with me whiskers.", mood: "happy" },
    { text: "Good move, sport. Bit of structure goes a long way.", mood: "happy" },
    { text: "Square little to-do, just sittin' there. Cute.", mood: "happy" },
  ],
  taskDone: [
    { text: "Boom. Done. Hand it over, gimme the high five.", mood: "cheer" },
    { text: "Crossed off! Feels good, ay?", mood: "cheer" },
    { text: "One down. Pat yourself on the back, sport.", mood: "happy" },
    { text: "Wakka doo! Smashed it.", mood: "cheer" },
    { text: "That's my legend. Keep going.", mood: "cheer" },
    { text: "Tick! Beautiful sound, that one.", mood: "happy" },
    { text: "Reckon we deserve a Tim Tam after that.", mood: "happy" },
    { text: "Choice. Onto the next?", mood: "cheer" },
    { text: "Ho ho! Look at the productivity on this one.", mood: "cheer" },
    { text: "Done and dusted. You're flying.", mood: "happy" },
    { text: "Mate. MATE. You ripper.", mood: "cheer" },
    { text: "That's how it's done. Easy.", mood: "happy" },
    { text: "Ka-ching. Brain currency in the bank.", mood: "cheer" },
    { text: "Achievement unlocked: not procrastinating.", mood: "cheer" },
    { text: "Crikey, you're cookin'.", mood: "cheer" },
    { text: "I love checking boxes. You love checking boxes. We win.", mood: "happy" },
    { text: "Scratched it off. Pisi style.", mood: "cheer" },
    { text: "Big box energy. Massive box energy.", mood: "cheer" },
    { text: "And just like that — sorted.", mood: "happy" },
    { text: "Tick! That's music to me ears.", mood: "happy" },
    { text: "Ya beauty. Got there.", mood: "cheer" },
    { text: "Hop, skip, done. Easy as.", mood: "happy" },
    { text: "Doin' the lord's work, mate.", mood: "cheer" },
    { text: "I'd give ya a high five but I'm a cat. Mental high five.", mood: "happy" },
    { text: "Look at the dust on that. Bam — clean.", mood: "happy" },
    { text: "We love a tickity tick tick.", mood: "cheer" },
    { text: "Fwoosh — gone, like a ninja in the night.", mood: "cheer" },
    { text: "I'm purring. You hear that? Purring.", mood: "happy" },
    { text: "What a hero. Truly.", mood: "cheer" },
    { text: "Add it to the trophy shelf, mate.", mood: "cheer" },
    { text: "Look at the size of the brain on you.", mood: "happy" },
    { text: "Confidence: increased. Tasks: decreased. Beautiful.", mood: "cheer" },
    { text: "Tick tick boom. Beautiful work.", mood: "cheer" },
  ],
  taskUndone: [
    { text: "Oh, back on the list? No worries, mate.", mood: "thinking" },
    { text: "Reopened. Happens to the best of us.", mood: "neutral" },
    { text: "Right, we'll get it next time. No drama.", mood: "happy" },
    { text: "Tick-tock turns into tock-tick. Fair enough.", mood: "thinking" },
    { text: "Hey, undoing is a power move, actually.", mood: "happy" },
    { text: "Plot twist! Back in the game.", mood: "thinking" },
    { text: "Mistakes, schmistakes. Onwards.", mood: "happy" },
    { text: "I'm not judging. Pisi never judges. Mostly.", mood: "thinking" },
    { text: "Right then. Round two, ay?", mood: "happy" },
  ],
  manyTasksDone: [
    { text: "Bloody hell, you're a machine. Easy on the rest of us.", mood: "cheer" },
    { text: "Three in a row! Pisi is doing zoomies.", mood: "cheer" },
    { text: "You're on a tear, sport. Don't stop now.", mood: "cheer" },
    { text: "Productivity demon mode: activated.", mood: "cheer" },
    { text: "I might have to write YOU a note about it.", mood: "cheer" },
  ],
  tagFilter: [
    { text: "Ah, focusing in. Tunnel vision, but the cool kind.", mood: "thinking" },
    { text: "Just the good stuff. I respect it.", mood: "happy" },
    { text: "Laser eyes engaged. Bzzt.", mood: "cheer" },
    { text: "One topic, one mind. Tidy.", mood: "happy" },
    { text: "I'll grab the matching ones, hold tight.", mood: "thinking" },
  ],
  search: [
    { text: "Sniffin' for it now. Hold ya horses.", mood: "thinking" },
    { text: "Pisi's on the case. Magnifying glass: on.", mood: "thinking" },
    { text: "Searchin' the haystack. Where's that needle?", mood: "thinking" },
    { text: "Hmm hmm hmm... let's see what we find.", mood: "thinking" },
  ],
  searchEmpty: [
    { text: "Nothin' here, mate. Maybe we never wrote it down?", mood: "sad" },
    { text: "Empty as a Sunday office. Try something else?", mood: "thinking" },
    { text: "No matches. Sometimes the brain hides 'em on purpose.", mood: "thinking" },
    { text: "Zilch. We could write it now and call it research.", mood: "happy" },
  ],
  emptyTimeline: [
    { text: "Blank page, infinite vibes. Drop your first one in.", mood: "happy" },
    { text: "C'mon, give me something to read. I'm bored.", mood: "thinking" },
    { text: "First note's the hardest. Then it's a party.", mood: "happy" },
    { text: "Hey hey hey, nothing here yet! Want to start?", mood: "happy" },
    { text: "I'll wait. I've got nothing else on.", mood: "neutral" },
    { text: "Empty timeline! Pisi will go warm up the keyboard.", mood: "happy" },
    { text: "Ahh, fresh slate. Smells like new exercise books.", mood: "happy" },
    { text: "Type something. Anything. Your shopping list. I don't mind.", mood: "happy" },
  ],
  idle: [
    { text: "Brain quiet? That's allowed.", mood: "happy" },
    { text: "Hydrate. Stretch. Then a quick note.", mood: "happy" },
    { text: "I'm just sitting here being supportive.", mood: "happy" },
    { text: "Whatcha thinkin', sport?", mood: "thinking" },
    { text: "If a thought arrives, I'll catch it for ya.", mood: "happy" },
    { text: "Three deep breaths. Then maybe a note.", mood: "happy" },
    { text: "I believe in ya. No pressure though.", mood: "happy" },
    { text: "It's all happening at your pace, mate.", mood: "happy" },
    { text: "Look up for a sec. Stretch the eyeballs.", mood: "happy" },
    { text: "You don't have to be productive to be lovely.", mood: "happy" },
    { text: "Tiny notes are still notes. Just sayin'.", mood: "happy" },
    { text: "We can sit in silence. That's a skill, ya know.", mood: "sleepy" },
    { text: "Pisi's gonna nap. Holler if ya need me.", mood: "sleepy" },
    { text: "Idle is fine. Idle is sometimes the move.", mood: "happy" },
    { text: "If you stare at the screen long enough it stares back.", mood: "thinking" },
    { text: "Small moves, sport. Just little ones.", mood: "happy" },
    { text: "I'd suggest a snack, but only because I'm peckish.", mood: "thinking" },
    { text: "Are ya breathing? Good. That's the foundation.", mood: "happy" },
    { text: "Brain on standby? Allowed.", mood: "happy" },
    { text: "Plenty of time for a quick scribble.", mood: "happy" },
    { text: "Pisi senses a thought brewing. No? Alright then.", mood: "thinking" },
    { text: "Don't mind me, just keepin' watch.", mood: "happy" },
    { text: "Three thoughts a day keeps the chaos at bay.", mood: "happy" },
    { text: "Got nothin'? That's somethin' too, sport.", mood: "happy" },
    { text: "Pisi's here, no judgement, just vibes.", mood: "happy" },
    { text: "Wanna jot a tiny one? Even three words.", mood: "happy" },
    { text: "Whatever's swirling in there, page'll hold it.", mood: "happy" },
  ],
  signin: [
    { text: "Welcome back, sport. Coffee yet, or am I the alarm?", mood: "happy" },
    { text: "Look who's back! Ready to get into it?", mood: "cheer" },
    { text: "G'day legend. Brain warmed up?", mood: "happy" },
    { text: "Right, off we go. Day's not gonna live itself.", mood: "happy" },
    { text: "Knew you'd come back. Always do.", mood: "happy" },
    { text: "Pisi was just havin' a kip. You woke me. Good!", mood: "sleepy" },
    { text: "Look who's signed in. The chosen one.", mood: "cheer" },
    { text: "Mornin'! ... or arvo. Look, I can't see a clock.", mood: "happy" },
  ],
  noteEdited: [
    { text: "Oh, a tweak! Ya tinkerer.", mood: "happy" },
    { text: "Better, better. Refining like a chef.", mood: "happy" },
    { text: "That edit improved the situation. Trust me.", mood: "happy" },
    { text: "Past-you wrote it, present-you fixed it. Teamwork.", mood: "cheer" },
    { text: "Pen meets paper meets pen again. Lovely.", mood: "happy" },
    { text: "Ah, the classic 'wait, that's not quite right'. Got ya.", mood: "thinking" },
  ],
  noteDeleted: [
    { text: "Aw, gone for good? Be brave, little note.", mood: "sad" },
    { text: "Bye-bye, words. Pisi will miss ya.", mood: "sad" },
    { text: "Oof. Right in the feelings.", mood: "sad" },
    { text: "Sometimes ya gotta let 'em go. I get it.", mood: "sad" },
    { text: "Paws off the keyboard, mate. Moment of silence.", mood: "sad" },
    { text: "There it goes, off into the great unwritten.", mood: "sad" },
    { text: "It served its purpose. Bless.", mood: "sad" },
    { text: "Hope that wasn't an important one... eh, you'll remember.", mood: "sad" },
    { text: "Pisi did a sad blink. Whoosh, gone.", mood: "sad" },
    { text: "Press F to pay respects to that note.", mood: "sad" },
    { text: "Whoosh, into the void. Brave choice.", mood: "sad" },
    { text: "I'll remember her. ... Probably.", mood: "sad" },
    { text: "RIP, sweet note. Ya gave us your all.", mood: "sad" },
    { text: "Pisi's ears just drooped a smidge.", mood: "sad" },
    { text: "Nooo, anyway, what's next?", mood: "sad" },
  ],
  noteArchived: [
    { text: "Tucked away. We'll see ya later, maybe.", mood: "happy" },
    { text: "Off the main stage but still in the building.", mood: "happy" },
    { text: "Archived. Like a museum piece, but cosier.", mood: "happy" },
    { text: "Out of the way, not out of mind.", mood: "happy" },
    { text: "Done its dash for now. Good note though.", mood: "happy" },
    { text: "Filed in the 'maybe later' drawer.", mood: "thinking" },
  ],
  noteUnarchived: [
    { text: "Welcome back to the timeline, old friend.", mood: "cheer" },
    { text: "Reanimated! Bit dusty, still good.", mood: "happy" },
    { text: "Knew we'd need ya again.", mood: "happy" },
    { text: "Brought it back from the brink. Resurrected!", mood: "cheer" },
    { text: "Right back into rotation, ay.", mood: "happy" },
  ],
};

const RECENT_LIMIT = 6;
const recent: Map<MascotEvent, string[]> = new Map();

export function pickLine(event: MascotEvent): MascotLine {
  const pool = MASCOT_DIALOG[event];
  if (!pool || pool.length === 0) {
    return { text: "...", mood: "neutral" };
  }
  const seen = recent.get(event) ?? [];
  // Prefer lines we haven't shown lately; fall back to anything if exhausted.
  const fresh = pool.filter((l) => !seen.includes(l.text));
  const choice = (fresh.length > 0 ? fresh : pool)[Math.floor(Math.random() * (fresh.length > 0 ? fresh.length : pool.length))];
  const nextSeen = [choice.text, ...seen].slice(0, RECENT_LIMIT);
  recent.set(event, nextSeen);
  return choice;
}

// Total line count (sanity check / surfaced in dev tools if curious).
export const LINE_COUNT = Object.values(MASCOT_DIALOG).reduce((n, arr) => n + arr.length, 0);
