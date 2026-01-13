module.exports = {
  extends: [
    "stylelint-config-recommended"
  ],
  rules: {
    // Allow Tailwind/PostCSS at-rules so editors and CI stylelint don't flag them
    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen",
          "layer"
        ]
      }
    ]
  }
};
