import Ably from 'ably';

let ably: Ably.Rest | null = null;

export function getAbly() {
  if (!process.env.ABLY_API_KEY) {
    console.warn('ABLY_API_KEY is not defined');
    return null;
  }

  if (!ably) {
    ably = new Ably.Rest(process.env.ABLY_API_KEY);
  }
  return ably;
}

export async function publishUpdate(channelName: string, message: any) {
  const client = getAbly();
  if (client) {
    try {
      const channel = client.channels.get(channelName);
      await channel.publish('update', message);
    } catch (error) {
      console.error(`Ably publish error on channel ${channelName}:`, error);
    }
  }
}
