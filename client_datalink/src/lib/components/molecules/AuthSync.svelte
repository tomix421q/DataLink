<script lang="ts">
  import { useActiveUser } from '$lib/api/queries/auth';
  import { userStore } from '$lib/stores/UserStore.svelte';

  const userQuery = useActiveUser();

  $effect(() => {
    if (userQuery.data) {
      userStore.setUser(userQuery.data);
    } else if (userQuery.isError) {
      userStore.clearUser();
    }
  });
</script>