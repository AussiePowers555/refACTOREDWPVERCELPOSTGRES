import { spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface TunnelInstance {
  id: string;
  token: string;
  publicUrl: string;
  process: ChildProcess;
  port: number;
  createdAt: Date;
  expiresAt: Date;
  status: 'creating' | 'active' | 'expired' | 'destroyed';
}

class CloudflareManager {
  private tunnels: Map<string, TunnelInstance> = new Map();
  private nextPort = 9200; // Start from port 9200 for dynamic instances

  /**
   * Create a new Cloudflare tunnel for a signature token
   */
  async createTunnelForToken(token: string): Promise<string> {
    console.log(`🚀 Creating Cloudflare tunnel for token: ${token}`);

    // Check if tunnel already exists
    if (this.tunnels.has(token)) {
      const existing = this.tunnels.get(token)!;
      if (existing.status === 'active' && existing.expiresAt > new Date()) {
        console.log(`✅ Using existing tunnel: ${existing.publicUrl}`);
        return existing.publicUrl;
      } else {
        await this.destroyTunnel(token);
      }
    }

    const port = this.getNextPort();
    const tunnelId = `tunnel-${Date.now()}-${token.substring(0, 8)}`;

    try {
      // Step 1: Start Next.js on dedicated port
      console.log(`📡 Starting Next.js on port ${port}...`);
      const nextProcess = await this.startNextInstance(port);

      // Step 2: Wait for Next.js to be ready
      await this.waitForServer(port, 30000);
      console.log(`✅ Next.js ready on port ${port}`);

      // Step 3: Create Cloudflare tunnel
      console.log(`🌐 Creating Cloudflare tunnel...`);
      const publicUrl = await this.createCloudflareConnection(port);
      console.log(`✅ Tunnel created: ${publicUrl}`);

      // Step 4: Store tunnel info
      const tunnelInstance: TunnelInstance = {
        id: tunnelId,
        token,
        publicUrl,
        process: nextProcess,
        port,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
        status: 'active'
      };

      this.tunnels.set(token, tunnelInstance);

      // Step 5: Auto-cleanup after 72 hours
      setTimeout(() => {
        this.destroyTunnel(token);
      }, 72 * 60 * 60 * 1000);

      console.log(`🎉 Tunnel successfully created for token ${token}`);
      return publicUrl;

    } catch (error) {
      console.error(`❌ Error creating tunnel for token ${token}:`, error);
      throw new Error(`Failed to create tunnel: ${error}`);
    }
  }

  /**
   * Start Next.js instance on specific port
   */
  private async startNextInstance(port: number): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      console.log(`Starting Next.js with: npm run dev -- -p ${port}`);
      
      const nextProcess = spawn('npm', ['run', 'dev', '--', '-p', port.toString()], {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env }
      });

      let output = '';
      let errorOutput = '';

      nextProcess.stdout?.on('data', (data) => {
        output += data.toString();
        if (output.includes('Ready in') || output.includes('compiled successfully')) {
          resolve(nextProcess);
        }
      });

      nextProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
        console.log(`Next.js stderr: ${data}`);
      });

      nextProcess.on('error', (error) => {
        console.error(`Next.js process error:`, error);
        reject(error);
      });

      nextProcess.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Next.js process exited with code ${code}`);
          console.error(`Output: ${output}`);
          console.error(`Error output: ${errorOutput}`);
          reject(new Error(`Next.js process failed with code ${code}`));
        }
      });

      // Timeout after 45 seconds
      setTimeout(() => {
        if (!nextProcess.killed) {
          nextProcess.kill();
          reject(new Error('Timeout waiting for Next.js to start'));
        }
      }, 45000);
    });
  }

  /**
   * Create Cloudflare tunnel connection
   */
  private async createCloudflareConnection(port: number): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(`Creating cloudflared tunnel for port ${port}`);
      
      const cloudflaredProcess = spawn('cloudflared', [
        'tunnel',
        '--url', `http://localhost:${port}`
      ], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let found = false;

      const handleOutput = (data: Buffer) => {
        output += data.toString();
        
        // Look for the tunnel URL in the output
        const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
        if (urlMatch && !found) {
          found = true;
          const publicUrl = urlMatch[0];
          console.log(`🌐 Cloudflare tunnel URL found: ${publicUrl}`);
          resolve(publicUrl);
        }
      };

      cloudflaredProcess.stdout?.on('data', handleOutput);
      cloudflaredProcess.stderr?.on('data', handleOutput);

      cloudflaredProcess.on('error', (error) => {
        console.error('Cloudflared process error:', error);
        if (!found) {
          reject(error);
        }
      });

      cloudflaredProcess.on('exit', (code) => {
        console.log(`Cloudflared process exited with code ${code}`);
        if (!found) {
          reject(new Error(`Cloudflared process failed with code ${code}`));
        }
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!found) {
          cloudflaredProcess.kill();
          reject(new Error('Timeout waiting for Cloudflare tunnel URL'));
        }
      }, 60000);
    });
  }

  /**
   * Wait for server to be ready
   */
  private async waitForServer(port: number, timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`http://localhost:${port}`, {
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.status === 200 || response.status === 404) {
          return; // Server is ready
        }
      } catch (error) {
        // Server not ready yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error(`Server on port ${port} not ready within ${timeout}ms`);
  }

  /**
   * Get next available port
   */
  private getNextPort(): number {
    const usedPorts = Array.from(this.tunnels.values()).map(t => t.port);
    while (usedPorts.includes(this.nextPort)) {
      this.nextPort++;
    }
    return this.nextPort++;
  }

  /**
   * Destroy tunnel for specific token
   */
  async destroyTunnel(token: string): Promise<void> {
    const tunnel = this.tunnels.get(token);
    if (!tunnel) {
      console.log(`⚠️ No tunnel found for token ${token}`);
      return;
    }

    try {
      console.log(`🗑️ Destroying tunnel for token ${token}`);
      
      // Kill the Next.js process
      if (tunnel.process && !tunnel.process.killed) {
        tunnel.process.kill('SIGTERM');
        
        // Force kill if not dead in 5 seconds
        setTimeout(() => {
          if (!tunnel.process.killed) {
            tunnel.process.kill('SIGKILL');
          }
        }, 5000);
      }

      // Update status
      tunnel.status = 'destroyed';
      
      // Remove from active tunnels
      this.tunnels.delete(token);
      
      console.log(`✅ Tunnel destroyed for token ${token}`);
    } catch (error) {
      console.error(`❌ Error destroying tunnel for token ${token}:`, error);
    }
  }

  /**
   * Get tunnel info for token
   */
  getTunnelInfo(token: string): TunnelInstance | null {
    return this.tunnels.get(token) || null;
  }

  /**
   * Get all active tunnels
   */
  getActiveTunnels(): TunnelInstance[] {
    return Array.from(this.tunnels.values()).filter(t => t.status === 'active');
  }

  /**
   * Cleanup expired tunnels
   */
  async cleanupExpiredTunnels(): Promise<void> {
    const now = new Date();
    for (const [token, tunnel] of this.tunnels.entries()) {
      if (tunnel.expiresAt <= now) {
        await this.destroyTunnel(token);
      }
    }
  }
}

// Singleton instance
export const cloudflareManager = new CloudflareManager();

// Cleanup expired tunnels every hour
setInterval(() => {
  cloudflareManager.cleanupExpiredTunnels();
}, 60 * 60 * 1000);