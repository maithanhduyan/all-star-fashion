# ============================================
# All Star Fashion — Production Dockerfile
# Multi-stage build for Deno Fresh app
# ============================================

FROM denoland/deno:2.1.4

WORKDIR /app

# Copy dependency manifests first for better caching
COPY deno.json deno.lock* ./

# Copy source code
COPY . .

# Cache all dependencies (including remote imports)
RUN deno cache main.ts

# Build Fresh (generate static assets & pre-compile)
RUN deno task build

# Create non-root user for security
RUN addgroup --system --gid 1001 appuser && \
    adduser --system --uid 1001 --ingroup appuser appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["deno", "eval", "const r = await fetch('http://localhost:8000'); if(r.status !== 200) Deno.exit(1);"]

CMD ["deno", "run", "-A", "main.ts"]
