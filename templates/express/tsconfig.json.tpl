{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "Preserve",
    "moduleResolution": "Bundler",
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true
  },
  "include": ["{{srcDir}}", "*.ts"],
  "exclude": ["node_modules", "dist"]
}
