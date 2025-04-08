import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { MetaMaskStateLog, Transaction } from "@/types/state-log";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface MobileInfoProps {
  stateLog: MetaMaskStateLog;
}

type MobileVariable = {
  id: string;
  label: string;
  value: string | boolean | number | undefined | string[];
  type: string;
};

export function MobileInfo({ stateLog }: MobileInfoProps) {
  const mobileVariables = useMemo(() => {
    if (!stateLog) {
      return [];
    }

    const variables: MobileVariable[] = [
      {
        id: 'submittedTime',
        label: 'Submitted Time',
        value: stateLog.submittedTime,
        type: 'date',
      },
      {
        id: 'visitedDappsByHostname',
        label: 'Visited Dapps',
        value: stateLog.metamask?.visitedDappsByHostname?.join(', ') || 'None',
        type: 'string',
      },
      {
        id: 'origin',
        label: 'TX Origin',
        value: getFirstTransactionOrigin(stateLog),
        type: 'site',
      },
      {
        id: 'seedphraseBackedUp',
        label: 'Seedphrase Backed Up',
        value: stateLog.seedphraseBackedUp,
        type: 'boolean',
      },
      {
        id: 'automaticSecurityChecksEnabled',
        label: 'Automatic Security Checks Enabled',
        value: stateLog.automaticSecurityChecksEnabled,
        type: 'boolean',
      },
      {
        id: 'securityAlertsEnabled',
        label: 'Security Alerts Enabled',
        value: stateLog.securityAlertsEnabled,
        type: 'boolean',
      },
      {
        id: 'isProfileSyncingEnabled',
        label: 'Profile Syncing Enabled',
        value: stateLog.isProfileSyncingEnabled,
        type: 'boolean',
      },
      {
        id: 'hasAccountSyncingSyncedAtLeastOnce',
        label: 'Account Syncing Has Synced At Least Once',
        value: stateLog.hasAccountSyncingSyncedAtLeastOnce,
        type: 'boolean',
      }
    ];

    // Add additional variables from the engine section if available
    if (stateLog.engine?.backgroundState) {
      // Check if we have the NetworkController info
      if (stateLog.engine.backgroundState.NetworkController) {
        const networkController = stateLog.engine.backgroundState.NetworkController;

        if (networkController.network) {
          variables.push({
            id: 'networkType',
            label: 'Network Type',
            value: networkController.network,
            type: 'string',
          });
        }

        if (networkController.provider?.chainId) {
          variables.push({
            id: 'chainId',
            label: 'Chain ID',
            value: networkController.provider.chainId,
            type: 'string',
          });
        }

        if (networkController.provider?.nickname) {
          variables.push({
            id: 'networkName',
            label: 'Network Name',
            value: networkController.provider.nickname,
            type: 'string',
          });
        }
      }

      // Check if we have PreferencesController info
      if (stateLog.engine.backgroundState.PreferencesController?.featureFlags) {
        const featureFlags = stateLog.engine.backgroundState.PreferencesController.featureFlags;
        for (const [key, value] of Object.entries(featureFlags)) {
          if (typeof value === 'boolean') {
            variables.push({
              id: `featureFlag_${key}`,
              label: `Feature Flag: ${key}`,
              value: value,
              type: 'boolean',
            });
          }
        }
      }

      // Add info about number of accounts
      if (stateLog.engine.backgroundState.AccountTrackerController?.accounts) {
        const accountCount = Object.keys(stateLog.engine.backgroundState.AccountTrackerController.accounts).length;
        variables.push({
          id: 'accountCount',
          label: 'Number of Accounts',
          value: accountCount,
          type: 'number',
        });
      }

      // Add info about number of transactions
      if (stateLog.engine.backgroundState.TransactionController?.transactions) {
        const txs = stateLog.engine.backgroundState.TransactionController.transactions;
        const txCount = Array.isArray(txs) ? txs.length : Object.keys(txs).length;
        variables.push({
          id: 'transactionCount',
          label: 'Number of Transactions',
          value: txCount,
          type: 'number',
        });
      }
    }

    return variables.filter(item => item.value !== undefined) as MobileVariable[];
  }, [stateLog]);

  if (!stateLog || mobileVariables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mobile Information</CardTitle>
          <CardDescription>No mobile-specific information found in this state log</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Helper function to format values based on type
  const formatValue = (item: MobileVariable) => {
    if (item.value === undefined || item.value === null) return 'Not available';

    switch (item.type) {
      case 'boolean':
        return item.value ? 'Yes' : 'No';
      case 'date':
        return new Date(item.value.toString()).toLocaleString();
      default:
        return String(item.value);
    }
  };

  // Determine if this is likely a mobile state log
  const isMobileStateLog = mobileVariables.length >= 3 || !!stateLog.engine?.backgroundState;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Mobile Information</CardTitle>
        <CardDescription>
          {isMobileStateLog
            ? "This appears to be a MetaMask Mobile state log"
            : "This state log contains some mobile data, but may not be from MetaMask Mobile"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Setting</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mobileVariables.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.label}
                  </TableCell>
                  <TableCell>
                    {formatValue(item)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get the origin of the first transaction safely
function getFirstTransactionOrigin(stateLog: MetaMaskStateLog): string | undefined {
  // Check mobile transactions first
  const mobileTxs = stateLog.engine?.backgroundState?.TransactionController?.transactions;
  if (mobileTxs) {
    if (Array.isArray(mobileTxs) && mobileTxs.length > 0) {
      return mobileTxs[0].origin;
    }

    if (!Array.isArray(mobileTxs)) {
      const firstKey = Object.keys(mobileTxs)[0];
      if (firstKey) {
        return (mobileTxs as Record<string, Transaction>)[firstKey].origin;
      }
    }
  }

  // Then check desktop transactions
  const desktopTxs = stateLog.metamask?.transactions;
  if (desktopTxs) {
    if (Array.isArray(desktopTxs) && desktopTxs.length > 0) {
      return desktopTxs[0].origin;
    }

    if (!Array.isArray(desktopTxs)) {
      const firstKey = Object.keys(desktopTxs)[0];
      if (firstKey) {
        return (desktopTxs as Record<string, Transaction>)[firstKey].origin;
      }
    }
  }

  return undefined;
}
