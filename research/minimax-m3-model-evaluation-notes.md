# MiniMax M3 Model Evaluation Notes

## Official M3 announcement reviewed

Source: https://www.minimax.io/blog/minimax-m3

- MiniMax M3 is presented in the provider's **LLM** category, not the Speech & Music category.
- The announcement describes M3 as a frontier coding and agentic model with a 1M-token context window, image/video input, desktop-computer operation, API availability, and a thinking toggle.
- The same official navigation lists **MiniMax Music 3.0** separately under Speech & Music, linking to the music-generation guide at https://platform.minimax.io/docs/guides/music-generation.

## Preliminary implication

MiniMax M3 should not be substituted directly for the Riff's current Music 2.6 generation endpoint. It may be relevant later for Riffy / plan translation, but Music 3.0 is the model family that must be evaluated for fusion and vocal audio generation.

## Official Music 3.0 documentation reviewed

Sources:

- https://platform.minimax.io/docs/guides/music-generation
- https://platform.minimax.io/docs/api-reference/music-generation
- https://platform.minimax.io/docs/guides/pricing-paygo

- Music 3.0 is the provider's recommended current **text-to-music** model. The guide claims better creative-intent understanding, higher sound quality, specific-instrument and playing-technique support, and improved vocal synthesis.
- The Music Generation API accepts `music-3.0`, `music-2.6`, and `music-cover` as distinct model values. Its documented instrumental generation path uses `prompt` plus `is_instrumental: true`.
- The documented current API does not list `song_file`, `voice_file`, or `instrumental_file` on the text-to-music models. It lists `audio_url` / `audio_base64` only for the separate `music-cover` workflow.
- Music 3.0 and Music 2.6 are both listed at $0.15 per up-to-5-minute output. Music 3.0 has the same published 120 RPM paid-tier rate limit as Music 2.6.

## Implication for Riff

Music 3.0 is worth a controlled text-and-lyrics comparison against Music 2.6 because it is the relevant audio model family and is advertised as stronger at specific instruments and techniques. The existing undocumented reference-audio fields must be treated as an independent integration risk: switching the model alone will not prove that the palette audio sample is being used.
