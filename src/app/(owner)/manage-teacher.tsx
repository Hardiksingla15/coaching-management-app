import { useLocalSearchParams } from "expo-router";

import ManageUserForm from "../../components/owner/ManageUserForm";

export default function ManageTeacherScreen() {
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const userId = params.mode === "create" ? undefined : params.id;

  return <ManageUserForm userId={userId} role="teacher" />;
}
