
model {{pascal}} {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now()) @map("created_at")

  @@map("{{pluralSnake}}")
}
