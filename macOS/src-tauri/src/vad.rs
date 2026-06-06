pub struct Vad {
    pub threshold: f32,
    pub silence_ms: u64,
    pub sample_rate: u32,
    pub max_chunk_ms: u64,
    pub min_chunk_ms: u64,
    pub partial_ms: u64,      // ← ใหม่: emit partial chunk ทุก N ms

    pub is_speaking: bool,
    pub silence_samples: usize,
    pub speech_buffer: Vec<f32>,
    pub total_samples: usize,
    pub partial_samples: usize, // ← นับ samples ตั้งแต่ partial ล่าสุด
}

impl Vad {
    pub fn new() -> Self {
        Self {
            threshold: 0.01,
            silence_ms: 1200,
            sample_rate: 16000,
            max_chunk_ms: 8000,
            min_chunk_ms: 500,
            partial_ms: 2000,   // emit partial ทุก 2 วิ
            is_speaking: false,
            silence_samples: 0,
            speech_buffer: Vec::new(),
            total_samples: 0,
            partial_samples: 0,
        }
    }

    /// return (final_chunk, partial_chunk)
    pub fn process_with_partial(&mut self, bytes: &[u8]) -> (Option<Vec<f32>>, Option<Vec<f32>>) {
        let samples = bytes_to_f32(bytes);
        let rms = compute_rms(&samples);

        let silence_limit = (self.sample_rate as f32
            * (self.silence_ms as f32 / 1000.0)) as usize;
        let max_samples = (self.sample_rate as f32
            * (self.max_chunk_ms as f32 / 1000.0)) as usize;
        let partial_limit = (self.sample_rate as f32
            * (self.partial_ms as f32 / 1000.0)) as usize;
        let min_samples = (self.sample_rate as f32
            * (self.min_chunk_ms as f32 / 1000.0)) as usize;

        if rms > self.threshold {
            self.is_speaking = true;
            self.silence_samples = 0;
            self.speech_buffer.extend_from_slice(&samples);
            self.total_samples += samples.len();
            self.partial_samples += samples.len();

            // max → flush final
            if self.total_samples >= max_samples {
                return (self.flush(min_samples), None);
            }

            // partial → emit preview ไม่ clear buffer
            if self.partial_samples >= partial_limit {
                self.partial_samples = 0;
                let partial = self.speech_buffer.clone();
                if partial.len() >= min_samples {
                    eprintln!("📡 Partial emit: {}ms",
                        partial.len() as f32 / 16000.0 * 1000.0);
                    return (None, Some(partial));
                }
            }

            (None, None)
        } else {
            if self.is_speaking {
                self.silence_samples += samples.len();
                self.speech_buffer.extend_from_slice(&samples);
                self.total_samples += samples.len();

                if self.silence_samples >= silence_limit || self.total_samples >= max_samples {
                    self.partial_samples = 0;
                    return (self.flush(min_samples), None);
                }
            }
            (None, None)
        }
    }

    // backward compat
    pub fn process(&mut self, bytes: &[u8]) -> Option<Vec<f32>> {
        self.process_with_partial(bytes).0
    }

    fn flush(&mut self, min_samples: usize) -> Option<Vec<f32>> {
        self.is_speaking = false;
        self.silence_samples = 0;
        self.total_samples = 0;
        self.partial_samples = 0;
        let result = self.speech_buffer.clone();
        self.speech_buffer.clear();

        if result.is_empty() { return None; }

        if result.len() < min_samples {
            eprintln!("🔇 Skip noise: {:.0}ms", result.len() as f32 / 16000.0 * 1000.0);
            return None;
        }

        Some(result)
    }
}

fn bytes_to_f32(bytes: &[u8]) -> Vec<f32> {
    bytes
        .chunks_exact(4)
        .map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]]))
        .collect()
}

pub fn compute_rms(samples: &[f32]) -> f32 {
    if samples.is_empty() { return 0.0; }
    let sum_sq: f32 = samples.iter().map(|s| s * s).sum();
    (sum_sq / samples.len() as f32).sqrt()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_silence_returns_none() {
        let mut vad = Vad::new();
        let (f, p) = vad.process_with_partial(&vec![0u8; 4096]);
        assert!(f.is_none() && p.is_none());
        println!("✅ Silence → None");
    }

    #[test]
    fn test_partial_emitted_during_speech() {
        let mut vad = Vad::new();
        vad.partial_ms = 500;
        vad.min_chunk_ms = 100;

        // เสียงดัง 500ms → partial ต้อง trigger
        let loud: Vec<u8> = (0..8000usize)
            .flat_map(|i| (0.5 * (i as f32 * 0.1).sin()).to_le_bytes())
            .collect();

        let (_, partial) = vad.process_with_partial(&loud);
        assert!(partial.is_some(), "partial should emit after partial_ms");
        println!("✅ Partial emitted: {}ms",
            partial.unwrap().len() as f32 / 16000.0 * 1000.0);
    }

    #[test]
    fn test_noise_discarded() {
        let mut vad = Vad::new();
        vad.silence_ms = 200;
        vad.min_chunk_ms = 500;

        let loud: Vec<u8> = (0..3200usize)
            .flat_map(|i| (0.5 * (i as f32 * 0.1).sin()).to_le_bytes())
            .collect();
        let _ = vad.process_with_partial(&loud);
        let (result, _) = vad.process_with_partial(&vec![0u8; 3200 * 4]);
        assert!(result.is_none());
        println!("✅ Noise discarded");
    }

    #[test]
    fn test_speech_kept() {
        let mut vad = Vad::new();
        vad.silence_ms = 200;
        vad.min_chunk_ms = 500;

        let loud: Vec<u8> = (0..16000usize)
            .flat_map(|i| (0.5 * (i as f32 * 0.1).sin()).to_le_bytes())
            .collect();
        let _ = vad.process_with_partial(&loud);
        let (result, _) = vad.process_with_partial(&vec![0u8; 16000 * 4]);
        assert!(result.is_some());
        println!("✅ Speech kept: {}ms",
            result.unwrap().len() as f32 / 16000.0 * 1000.0);
    }
}
