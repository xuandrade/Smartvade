/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Layout } from './components/Layout';
import { useAutoBackup } from './hooks/useAutoBackup';

export default function App() {
  useAutoBackup();
  return <Layout />;
}
