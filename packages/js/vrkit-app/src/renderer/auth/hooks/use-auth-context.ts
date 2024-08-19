import { useContext } from 'react';

import { AuthContext } from '../context/auth-context';
import {DefaultAuthContextValue} from "vrkit-app-renderer/auth/types"
// ----------------------------------------------------------------------

export function useAuthContext() {
  const context = DefaultAuthContextValue
  // const context = useContext(AuthContext);
  //
  // if (!context) {
  //   throw new Error('useAuthContext: Context must be used inside AuthProvider');
  // }

  return context;
}
