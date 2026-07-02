# Experimental Video Mode

## Requirement link
This folder supports the non-essential "Experimental video mode" requirement: users watch educational video content before playing related rounds.

## What has been started
- `ExperimentalVideoModeComponent` provides a routeable prototype for a video lesson queue.
- Lessons include a title, summary, source URL, and route to related gameplay.
- The video area is currently a safe placeholder instead of an active iframe so privacy, copyright, and content choices can be reviewed first.

## Stand-up talking points
- Identifying/planning: I separated lesson metadata from gameplay so future video content can be changed without rewriting the game engine.
- Producing/implementing: The current version demonstrates the flow: choose lesson, review content, start related rounds.
- Security: Embedding third-party videos needs careful checks for trusted URLs, privacy settings, and whether iframe permissions are necessary.
- Testing/evaluating: I would test mobile layout, lesson switching, trusted URL handling, and whether video mode actually improves score or retention.

## Next implementation steps
1. Replace placeholders with trusted video embeds.
2. Add sanitised/validated video URL handling.
3. Connect lessons to specific verse sets.
4. Track whether watching the lesson improves player results.
