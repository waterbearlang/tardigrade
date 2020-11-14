sound{

  // Probably need to define some types
  // and handle audio *files* differently
  // from generated sounds, and sound effects
  // and synths differently from instrumetal
  // notes and chords. Gah!

  synth:Sound = (wave:WaveChoice, attack:Number, release:Number) => {
    Sound.synth(wave, attack, release)
  }

}