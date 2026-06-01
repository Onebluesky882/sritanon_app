pub struct Vad {
    pub threshold: f32,
    pub silence_ms: u64,
    pub sample_rate: u32,
    pub max_chunk_ms: u64,    // ← ตัดทุก N ms ถึงแม้ยังพูดอยู่

    pub is_speaking: bool,
    pub silence_samples: usize,
    pub speech_buffer: Vec<f32>,
    pub total_samples: usize,
}

impl Vad {
    pub fn new() -> Self {
        Self {
            threshold: 0.02,
            silence_ms: 1200,      // เงียบ 1.2 วินาที → ตัด
            sample_rate: 16000,
            max_chunk_ms: 8000,   // สูงสุด 8 วินาที → ตัดทันที
            is_speaking: false,
            silence_samples: 0,
            speech_buffer: Vec::new(),
            total_samples: 0,
        }
    }

    pub fn process(&mut self, bytes: &[u8]) -> Option<Vec<f32>> {
        let samples = bytes_to_f32(bytes);
        let rms = compute_rms(&samples);

        let silence_limit = (self.sample_rate as f32
            * (self.silence_ms as f32 / 1000.0)) as usize;

        let max_samples = (self.sample_rate as f32
            * (self.max_chunk_ms as f32 / 1000.0)) as usize;

        if rms > self.threshold {
            self.is_speaking = true;
            self.silence_samples = 0;
            self.speech_buffer.extend_from_slice(&samples);
            self.total_samples += samples.len();

            // ถึง max → ตัดทันที
            if self.total_samples >= max_samples {
                return self.flush();
            }
            None
        } else {
            if self.is_speaking {
                self.silence_samples += samples.len();
                self.speech_buffer.extend_from_slice(&samples);
                self.total_samples += samples.len();

                // เงียบพอ หรือ ยาวเกิน → ตัด
                if self.silence_samples >= silence_limit || self.total_samples >= max_samples {
                    return self.flush();
                }
            }
            None
        }
    }

    fn flush(&mut self) -> Option<Vec<f32>> {
        if self.speech_buffer.is_empty() {
            return None;
        }
        self.is_speaking = false;
        self.silence_samples = 0;
        self.total_samples = 0;
        let result = self.speech_buffer.clone();
        self.speech_buffer.clear();
        Some(result)
    }
}

fn bytes_to_f32(bytes: &[u8]) -> Vec<f32> {
    bytes
        .chunks_exact(4)
        .map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]]))
        .collect()
}

fn compute_rms(samples: &[f32]) -> f32 {
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
        let silent = vec![0u8; 4096];
        assert!(vad.process(&silent).is_none());
    }

    #[test]
    fn test_max_chunk_forces_cut() {
        let mut vad = Vad::new();
        vad.max_chunk_ms = 1000; // ตัดทุก 1 วินาที

        let loud: Vec<u8> = (0..16000usize)
            .flat_map(|i| (0.5 * (i as f32 * 0.1).sin()).to_le_bytes())
            .collect();

        // ส่งเสียงดังต่อเนื่อง → ต้องตัดเมื่อถึง 1 วินาที
        let result = vad.process(&loud);
        assert!(result.is_some());
        println!("✅ Max chunk cut: {} samples", result.unwrap().len());
    }

    #[test]
    fn test_silence_triggers_cut() {
        let mut vad = Vad::new();
        vad.silence_ms = 200;

        let loud: Vec<u8> = (0..4800usize)
            .flat_map(|i| (0.5 * (i as f32 * 0.1).sin()).to_le_bytes())
            .collect();

        for _ in 0..3 {
            assert!(vad.process(&loud).is_none());
        }

        let silent = vec![0u8; 16000 * 4];
        let result = vad.process(&silent);
        assert!(result.is_some());
        println!("✅ Silence cut: {} samples", result.unwrap().len());
    }
}
