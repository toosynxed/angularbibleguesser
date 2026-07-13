# Scoring

Typed-guess modes (Normal, Daily, Custom, Create/Shared, Multiplayer, Racetrack) use the same scoring rules.

## Points (0–100 per round)

Every verse in the Bible has an ordered index. Your score is based on how far your guess is from the answer:

```
distance = |answerIndex − guessIndex|
score    = max(0, 100 − distance)
```

* Exact (or very close) guesses → high score
* Guesses more than 100 verses away → **0**
* Invalid / empty guess → treated as distance 100 → **0**
* Time runs out → **0** points and **0** stars

## Stars (0–3 per round)

Stars are hierarchical:

| Stars | Requirement |
|---|---|
| ★☆☆ | Correct **book** |
| ★★☆ | Correct book **and chapter** |
| ★★★ | Correct book, chapter, **and verse** (“Perfect!”) |

## Results screen

After a game you see:

* Per-round score and stars
* Book / chapter / verse correctness indicators
* Totals as fractions of the maximum possible (`rounds × 100` points, `rounds × 3` stars)

You can also **Copy Results** in a Wordle-style emoji grid to share.

## Academy scoring (different)

[[Academy]] uses multiple-choice questions, not typed verse guesses:

* Correct answer: **50–100** points depending on speed (untimed correct = 100)
* Wrong answer: **0**

## Related

* [[How-to-Play]]
* [[Racetrack]] (scroll rewards use score + stars + speed)
