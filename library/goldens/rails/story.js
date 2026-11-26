// story.js — written by director.py from the script; edit any shot, or add "@ key: value" lines in the script.
export const STORY = {
  beats: [
    { at: "Tony goes live", set: 'night', music: 'sitcom', cam: 'pull', cast: 'T C serious', items: ["hud \"LIVE 3 AM\" role=hook at=auto"] },
    { at: "Hey everybody Are", set: 'night', cam: 'in', cast: 'T C hips happy', items: [] },
    { at: "There is one", set: 'studio', cam: 'push', cast: 'D L serious | T C worried', items: ["hud \"1 VIEWER\" at=auto bg=teal"] },
    { at: "Mom go to", set: 'night', cam: 'in', cast: 'T cu tired', items: [] },
    { at: "Posting more is", set: 'community', music: 'happy', cam: 'push', cast: 'D L smile | T C smile', items: ["hud \"COMMUNITY\" at=auto bg=orange"] },
    { at: "So who do", set: 'community', cam: 'in', cast: 'T cu worried', items: [] },
    { at: "Send this to", set: 'studio', cam: 'push', cast: 'D L happy | T C hips happy', items: ["hud \"SEND TO A FRIEND\" at=auto bg=teal"] },
    { at: "Follow for the", set: 'studio', cam: 'push', cast: 'D L happy | T C hips happy', items: ["hud \"TONY DID IT AGAIN\" at=auto bg=green"] },
  ],
  loop: 0.4,
  style: 'ink',
  fns: {},
};
