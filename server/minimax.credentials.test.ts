import { describe, it, expect } from 'vitest';

/**
 * Test to validate MiniMax API credentials
 * This test verifies that the MINIMAX_API_KEY is valid and has sufficient balance
 */
describe('MiniMax API Credentials', () => {
  it('should have valid MINIMAX_API_KEY environment variable', () => {
    const apiKey = process.env.MINIMAX_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toBeTruthy();
    expect(apiKey?.length).toBeGreaterThan(10);
  });

  it('should be able to authenticate with MiniMax API', async () => {
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      throw new Error('MINIMAX_API_KEY not set');
    }

    // Make a test request to MiniMax to verify the key is valid
    const response = await fetch('https://api.minimax.io/v1/music_generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'music-2.6',
        prompt: 'test',
        lyrics: 'test',
        audio_setting: {
          sample_rate: 44100,
          bitrate: 256000,
          format: 'mp3',
        },
        output_format: 'hex',
      }),
    });

    const data = await response.json() as any;

    // Check for authentication errors
    if (data.base_resp?.status_code === 1001) {
      throw new Error('Invalid API key or authentication failed');
    }

    // Check for insufficient balance
    if (data.base_resp?.status_code === 1008) {
      throw new Error('Insufficient balance in MiniMax account');
    }

    // We expect either success (status_code 0) or a validation error (not auth/balance)
    // The important thing is that the API accepted our credentials
    expect(data.base_resp?.status_code).not.toBe(1001);
    expect(data.base_resp?.status_code).not.toBe(1008);
  });
});
