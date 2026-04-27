import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { assistantProviders, AssistantProviderKey, createWealthAssistantResponse } from '@/ai/openaiClient';
import { cancelPendingAction, confirmPendingAction, PendingAction } from '@/ai/toolRegistry';
import { MetricRow } from '@/components/MetricRow';
import { Panel } from '@/components/Panel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { Text } from '@/components/Text';
import { demoData } from '@/data/seed';
import { useWealthTheme } from '@/theme/ThemeProvider';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: unknown;
};

const chips = [
  'Show me my gold holdings versus spot.',
  'Record a 1oz gold coin purchase for $4,200 in my SMSF.',
  'I just bought $10,000 of IVV, update my dashboard.',
  "Add this month's SMSF rent.",
];

export function AICoachScreen() {
  const { colors } = useWealthTheme();
  const [input, setInput] = useState('');
  const [providerKey, setProviderKey] = useState<AssistantProviderKey>('oz_local');
  const [pendingAction, setPendingAction] = useState<PendingAction | undefined>();
  const [consoleLines, setConsoleLines] = useState<string[]>([
    '[OzWealthman Local] assistant console ready.',
    '[OzWealthman Local] choose a provider, send a prompt, and watch the tool layer report back here.',
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'I can explain your dashboard and prepare updates through structured tools. Material changes require confirmation before anything is saved.',
    },
  ]);

  async function sendCommand(command = input) {
    const trimmed = command.trim();
    if (!trimmed) {
      return;
    }

    setInput('');
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', content: trimmed }]);

    const result = await createWealthAssistantResponse({
      userId: demoData.user.id,
      input: trimmed,
    }, providerKey);

    setPendingAction(result.pendingAction);
    setConsoleLines((current) => [...result.consoleLines, ...current].slice(0, 12));
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.message,
        data: {
          toolCalls: result.toolCalls,
          toolResults: result.toolResults,
        },
      },
    ]);
  }

  function resolvePending(action: PendingAction, mode: 'confirm' | 'cancel') {
    const result = mode === 'confirm' ? confirmPendingAction(action) : cancelPendingAction(action);
    setPendingAction(undefined);
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.message,
        data: result.data,
      },
    ]);
  }

  return (
    <Screen>
      <Panel style={[styles.heroPanel, { backgroundColor: colors.surfaceRaised, borderColor: colors.accent }]}>
        <View style={styles.heroBackdrop} pointerEvents="none">
          <View style={[styles.heroGlowPrimary, { backgroundColor: `${colors.accent}16` }]} />
          <View style={[styles.heroGlowSecondary, { backgroundColor: `${colors.chartFive}18` }]} />
          <View style={[styles.heroLine, { backgroundColor: `${colors.chartFive}55` }]} />
        </View>
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text variant="small" subtle weight="800">
              AI COACH
            </Text>
            <Text variant="title">Ask OzWealthman</Text>
            <Text subtle>General information and tracking only. Calculations come from stored data and services, not invented AI values.</Text>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text variant="small" subtle weight="800">
              ACTIVE
            </Text>
            <Text weight="900" style={{ color: colors.accentStrong }}>
              {assistantProviders.find((provider) => provider.key === providerKey)?.shortLabel ?? 'Local'}
            </Text>
          </View>
        </View>
      </Panel>

      <SectionHeader title="Connector" />
      <Panel style={[styles.connectorPanel, { backgroundColor: colors.surfaceRaised }]}>
        <Text subtle>The local connector works now. ChatGPT, Claude and Copilot can be routed through secure backend endpoints and report their tool work back into this console.</Text>
        <View style={styles.chips}>
          {assistantProviders.map((provider) => (
            <Pressable key={provider.key} style={[styles.chip, { backgroundColor: providerKey === provider.key ? colors.accent : colors.surface, borderColor: providerKey === provider.key ? colors.accent : colors.border }]} onPress={() => setProviderKey(provider.key)}>
              <Text variant="small" weight="800" style={{ color: providerKey === provider.key ? colors.background : colors.text }}>
                {provider.shortLabel}
              </Text>
            </Pressable>
          ))}
        </View>
        <MetricRow label="Active connector" value={assistantProviders.find((provider) => provider.key === providerKey)?.label ?? providerKey} />
        <MetricRow label="Status" value={assistantProviders.find((provider) => provider.key === providerKey)?.status ?? 'live'} />
      </Panel>

      <SectionHeader title="Prompt shortcuts" />
      <View style={styles.chips}>
        {chips.map((chip) => (
          <Pressable key={chip} style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => sendCommand(chip)}>
            <Text variant="small" weight="800">
              {chip}
            </Text>
          </Pressable>
        ))}
      </View>

      {pendingAction ? (
        <Panel style={[styles.pendingPanel, { borderColor: colors.warning, backgroundColor: colors.surfaceRaised }]}>
          <Text variant="section">{pendingAction.title}</Text>
          <Text subtle>{pendingAction.summary}</Text>
          <MetricRow label="Action" value={pendingAction.type} />
          <MetricRow label="Status" value="Awaiting confirmation" tone="warning" />
          <View style={styles.actionRow}>
            <PrimaryButton label="Confirm save" onPress={() => resolvePending(pendingAction, 'confirm')} />
            <PrimaryButton label="Cancel" onPress={() => resolvePending(pendingAction, 'cancel')} variant="secondary" />
          </View>
        </Panel>
      ) : null}

      <SectionHeader title="Conversation" />
      <View style={styles.messages}>
        {messages.map((message) => (
          <Panel
            key={message.id}
            style={{
              backgroundColor: message.role === 'user' ? colors.surfaceRaised : colors.surface,
              borderColor: message.role === 'user' ? colors.accent : colors.border,
              alignSelf: message.role === 'user' ? 'flex-end' : 'stretch',
              width: message.role === 'user' ? '88%' : '100%',
            }}
          >
            <Text variant="label" subtle>
              {message.role === 'user' ? 'YOU' : 'OZWEALTHMAN'}
            </Text>
            <Text>{message.content}</Text>
            {message.data ? (
              <Text variant="small" subtle>
                Structured tool result returned. Production UI can render this as a typed response card.
              </Text>
            ) : null}
          </Panel>
        ))}
      </View>

      <SectionHeader title="Assistant console" action="Provider + tool trace" />
      <Panel style={[styles.consolePanel, { backgroundColor: '#020D08', borderColor: colors.border }]}>
        {consoleLines.map((line) => (
          <Text key={line} variant="small" style={[styles.consoleLine, { color: colors.chartFive }]}>
            {line}
          </Text>
        ))}
      </Panel>

      <Panel style={[styles.composePanel, { backgroundColor: colors.surfaceRaised }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your dashboard or request an update"
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          multiline
        />
        <PrimaryButton label="Send to coach" onPress={() => sendCommand()} />
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroPanel: {
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  heroGlowPrimary: {
    height: 170,
    position: 'absolute',
    right: -40,
    top: -26,
    transform: [{ rotate: '8deg' }],
    width: 280,
  },
  heroGlowSecondary: {
    bottom: -24,
    height: 110,
    left: -30,
    position: 'absolute',
    transform: [{ rotate: '-6deg' }],
    width: 240,
  },
  heroLine: {
    height: 2,
    left: 16,
    position: 'absolute',
    right: 16,
    top: 0,
  },
  heroTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroBadge: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    minWidth: 112,
    padding: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  connectorPanel: {
    gap: 12,
  },
  pendingPanel: {
    gap: 10,
  },
  messages: {
    gap: 12,
  },
  consolePanel: {
    gap: 6,
  },
  consoleLine: {
    fontFamily: 'monospace',
  },
  composePanel: {
    gap: 12,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 76,
    padding: 12,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
