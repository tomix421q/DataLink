<script lang="ts">
	import { userStore } from '$lib/stores/UserStore.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import {
		ArrowRight,
		Cable,
		Check,
		CheckCircle2,
		CircleDashed,
		FolderKanban,
		HardHat,
		LayoutDashboard,
		MonitorPlay,
		ShieldAlert,
		Tags,
		Timer,
		User
	} from '@lucide/svelte';
	import GradientText from '$lib/components/atoms/GradientText.svelte';
</script>

<main class="p-6 md:p-10 max-w-screen-2xl mx-auto space-y-16 animate-in fade-in duration-800">
	<header
		class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-2 border-muted pb-8"
	>
		<div>
			<h1>
				<GradientText
					colors={['var(--color-chart-3)', 'var(--color-primary)']}
					animationSpeed={5}
					showBorder={false}
					direction="horizontal"
					pauseOnHover={false}
					yoyo={true}
					class="mx-0! rounded-none"
				>
					<p class="font-heading font-extrabold px-0 bg-transparent! text-4xl md:text-5xl">
						Welcome to PLC DataLink
					</p>
				</GradientText>
			</h1>
			<p class="text-xl text-muted-foreground mt-2 font-medium">
				Centralized monitoring and real-time data collection for your factory floor.
			</p>
		</div>

		{#if userStore.isAdmin}
			<Button
				href="/addmachine"
				size="lg"
				class="shadow-md hover:scale-105 transition-transform text-lg"
			>
				+ Add New Machine
			</Button>
		{/if}
	</header>

	<!-- Roles -->
	<section class="animate-in fade-in slide-in-from-bottom-4 duration-200">
		<h2 class="text-2xl font-black font-heading mb-6">Who can do what?</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
			<article
				class="p-5 bg-card border-2 rounded-2xl shadow-sm flex flex-col h-full cardNormalize"
			>
				<div class="flex items-center gap-3 mb-4 border-b pb-4">
					<div class="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
						<ShieldAlert class="size-7" />
					</div>
					<h3 class="text-xl font-bold">Admin</h3>
				</div>
				<ul class="space-y-3 text-muted-foreground flex-grow text-sm">
					<li class="flex items-start gap-2">
						<span class="text-green-500 font-bold shrink-0">✓</span> Full access to the entire system.
					</li>
					<li class="flex items-start gap-2">
						<span class="text-green-500 font-bold shrink-0">✓</span> Add, edit, or delete PLC machines.
					</li>
					<li class="flex items-start gap-2">
						<span class="text-green-500 font-bold shrink-0">✓</span> Map tags and network settings.
					</li>
					<li class="flex items-start gap-2">
						<span class="text-green-500 font-bold shrink-0">✓</span> Create and manage global data loggers.
					</li>
				</ul>
			</article>

			<article
				class="p-5 bg-card border-2 rounded-2xl shadow-sm flex flex-col h-full cardNormalize"
			>
				<div class="flex items-center gap-3 mb-4 border-b pb-4">
					<div class="p-3 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
						<HardHat class="size-7" />
					</div>
					<h3 class="text-xl font-bold">Engineer</h3>
				</div>
				<ul class="space-y-3 text-muted-foreground flex-grow text-sm">
					<li class="flex items-start gap-2">
						<span class="text-green-500 font-bold shrink-0">✓</span> Set up custom loggers for data tracking.
					</li>
					<li class="flex items-start gap-2">
						<span class="text-green-500 font-bold shrink-0">✓</span> Pin folders to the Public Dashboards
						[comming].
					</li>
					<li class="flex items-start gap-2">
						<span class="text-destructive font-bold shrink-0">✗</span> Cannot delete machines,tags or
						edit IP configs.
					</li>
				</ul>
			</article>

			<article
				class="p-5 bg-card border-2 rounded-2xl shadow-sm flex flex-col h-full cardNormalize"
			>
				<div class="flex items-center gap-3 mb-4 border-b pb-4">
					<div class="p-3 bg-purple-500/10 text-purple-500 rounded-xl shrink-0">
						<User class="size-7" />
					</div>
					<h3 class="text-xl font-bold">User</h3>
				</div>
				<ul class="space-y-3 text-muted-foreground flex-grow text-sm">
					<li class="flex items-start gap-2">
						<span class="text-green-500 font-bold shrink-0">✓</span> Basic read-only access to machine
						data.
					</li>
					<li class="flex items-start gap-2">
						<span class="text-green-500 font-bold shrink-0">✓</span> Build and customize personal dashboards.
					</li>
					<li class="flex items-start gap-2">
						<span class="text-destructive font-bold shrink-0">✗</span> Cannot edit global settings, tags,
						or loggers.
					</li>
				</ul>
			</article>

			<article
				class="p-5 bg-card border-2 rounded-2xl shadow-sm flex flex-col h-full cardNormalize"
			>
				<div class="flex items-center gap-3 mb-4 border-b pb-4">
					<div class="p-3 bg-orange-500/10 text-orange-500 rounded-xl shrink-0">
						<MonitorPlay class="size-7" />
					</div>
					<h3 class="text-xl font-bold">TV Kiosk</h3>
				</div>
				<ul class="space-y-3 text-muted-foreground flex-grow text-sm">
					<li class="flex items-start gap-2">
						<span class="text-green-500 font-bold shrink-0">✓</span> Designed for large factory screens.
					</li>
					<li class="flex items-start gap-2">
						<span class="text-green-500 font-bold shrink-0">✓</span> Auto-refreshing data (no interaction
						needed).
					</li>
					<li class="flex items-start gap-2">
						<span class="text-green-500 font-bold shrink-0">✓</span> Huge typography for easy reading.
					</li>
				</ul>
			</article>
		</div>
	</section>

	<!-- Roadmap -->
	<section class="animate-in fade-in slide-in-from-bottom-8 duration-1000">
		<div class="mb-4">
			<h2 class="text-2xl font-black font-heading">System Roadmap</h2>
			<p class="text-muted-foreground mt-2">
				See what's currently available and what we are building next.
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
			<!-- AVAILABLE FEATURES -->
			<article
				class="p-6 bg-card border-2 border-green-500/20 rounded-3xl shadow-sm relative overflow-hidden"
			>
				<div class="absolute top-0 right-0 p-8 opacity-5">
					<CheckCircle2 class="size-32 text-green-500" />
				</div>

				<div class="flex items-center gap-3 mb-6 border-b border-muted pb-4 relative z-10">
					<div class="p-2 bg-green-500/10 text-green-500 rounded-xl">
						<CheckCircle2 class="size-6" />
					</div>
					<h3 class="text-xl font-bold">Currently Available</h3>
				</div>

				<ul class="space-y-4 text-muted-foreground relative z-10">
					<li class="flex items-start gap-3">
						<Check class="size-5 text-green-500 shrink-0 mt-0.5" />
						<div>
							<span class="font-bold text-foreground block">Real-Time PLC Connection</span>
							<span class="text-sm">Live data reading from S7-1500 machines without delays.</span>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<Check class="size-5 text-green-500 shrink-0 mt-0.5" />
						<div>
							<span class="font-bold text-foreground block">Plc data logger</span>
							<span class="text-sm"
								>Change value, interval or condition logger for checking plc data.</span
							>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<Check class="size-5 text-green-500 shrink-0 mt-0.5" />
						<div>
							<span class="font-bold text-foreground block">Global TV Kiosk Mode</span>
							<span class="text-sm"
								>Auto-refreshing global dashboard for large factory screens.</span
							>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<Check class="size-5 text-green-500 shrink-0 mt-0.5" />
						<div>
							<span class="font-bold text-foreground block">Custom Tag Folders</span>
							<span class="text-sm">Group specific PLC tags into logical workspaces.</span>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<Check class="size-5 text-green-500 shrink-0 mt-0.5" />
						<div>
							<span class="font-bold text-foreground block">Machine downtime monitoring</span>
							<span class="text-sm"
								>Monitoring machine downtime 24h/7d/30d (in the past logs when start downtime when
								end...)</span
							>
						</div>
					</li>
				</ul>
			</article>

			<!-- COMING SOON -->
			<article
				class="p-6 bg-card border-2 border-blue-500/20 rounded-3xl shadow-sm relative overflow-hidden"
			>
				<div class="absolute top-0 right-0 p-8 opacity-5">
					<Timer class="size-32 text-blue-500" />
				</div>

				<div class="flex items-center gap-3 mb-6 border-b border-muted pb-4 relative z-10">
					<div class="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
						<Timer class="size-6" />
					</div>
					<h3 class="text-xl font-bold">Coming Soon</h3>
				</div>

				<ul class="space-y-4 text-muted-foreground relative z-10">
					<li class="flex items-start gap-3">
						<CircleDashed class="size-5 text-blue-500 shrink-0 mt-0.5 animate-pulse" />
						<div>
							<span class="font-bold text-foreground block">Data snapshots</span>
							<span class="text-sm">Snapshot tag value every one hour</span>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<CircleDashed class="size-5 text-blue-500 shrink-0 mt-0.5 animate-pulse" />
						<div>
							<span class="font-bold text-foreground block">Historical Charts</span>
							<span class="text-sm"
								>Visualizing machine data and performance metrics over time.</span
							>
						</div>
					</li>

					<li class="flex items-start gap-3">
						<CircleDashed class="size-5 text-blue-500 shrink-0 mt-0.5 animate-pulse" />
						<div>
							<span class="font-bold text-foreground block">Downtime Analytics</span>
							<span class="text-sm">Automated tracking machine stops start->end downtime</span>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<CircleDashed class="size-5 text-blue-500 shrink-0 mt-0.5 animate-pulse" />
						<div>
							<span class="font-bold text-foreground block"
								>Global public dashboards, not only own main dashboard</span
							>
							<span class="text-sm">Custom public dashboards for other users</span>
						</div>
					</li>
				</ul>
			</article>
		</div>
	</section>

	<!-- How to start -->
	{#if userStore.isAdmin}
		<section class="animate-in fade-in slide-in-from-bottom-6 duration-600">
			<h2 class="text-2xl font-black font-heading mb-4">How to start monitoring?</h2>
			<section class="bg-secondary/30 p-8 rounded-3xl border border-secondary">
				<div class="flex flex-col lg:flex-row items-center justify-between gap-4 relative">
					<div class="flex flex-col items-center text-center w-full max-w-[200px] z-10">
						<div
							class="size-16 rounded-full bg-background border-2 border-primary flex items-center justify-center mb-4 shadow-sm"
						>
							<Cable class="size-8 text-primary" />
						</div>
						<h4 class="font-bold text-lg">1. Connect PLC</h4>
						<p class="text-xs text-muted-foreground mt-2">
							Enter machine IP, Rack and Slot to establish connection.
						</p>
					</div>
					<ArrowRight class="hidden lg:block size-8 text-muted-foreground/50 shrink-0" />
					<div class="flex flex-col items-center text-center w-full max-w-[200px] z-10">
						<div
							class="size-16 rounded-full bg-background border-2 border-primary flex items-center justify-center mb-4 shadow-sm"
						>
							<Tags class="size-8 text-primary" />
						</div>
						<h4 class="font-bold text-lg">2. Map Tags</h4>
						<p class="text-xs text-muted-foreground mt-2">
							Define variables (like DB1,X0.0) you want to read.
						</p>
					</div>
					<ArrowRight class="hidden lg:block size-8 text-muted-foreground/50 shrink-0" />
					<div class="flex flex-col items-center text-center w-full max-w-[200px] z-10">
						<div
							class="size-16 rounded-full bg-background border-2 border-primary flex items-center justify-center mb-4 shadow-sm"
						>
							<FolderKanban class="size-8 text-primary" />
						</div>
						<h4 class="font-bold text-lg">3. Group Data</h4>
						<p class="text-xs text-muted-foreground mt-2">
							Create logical folders (e.g. "Temperatures") for tags.
						</p>
					</div>
					<ArrowRight class="hidden lg:block size-8 text-muted-foreground/50 shrink-0" />
					<div class="flex flex-col items-center text-center w-full max-w-[200px] z-10">
						<div
							class="size-16 rounded-full bg-background border-2 border-primary flex items-center justify-center mb-4 shadow-sm"
						>
							<LayoutDashboard class="size-8 text-primary" />
						</div>
						<h4 class="font-bold text-lg">4. Pin to Dashboard</h4>
						<p class="text-xs text-muted-foreground mt-2">
							Pin important folders to the global TV Dashboard.
						</p>
					</div>
				</div>
			</section>
		</section>
	{:else}
		<section class="animate-in fade-in slide-in-from-bottom-6 duration-600">
			<h2 class="text-2xl font-black font-heading mb-3">Ready to check the data?</h2>
			<section class="bg-primary/5 p-8 rounded-3xl border-2 border-primary/20 text-center">
				<p class="text-muted-foreground mb-8 text-lg">
					Choose your dashboard and start monitoring live factory data.
				</p>

				<div class="flex flex-col sm:flex-row justify-center items-center gap-4">
					<Button
						href="/maindashboard"
						variant="outline"
						size="lg"
						class="shadow-sm hover:scale-105 transition-transform text-lg px-8 py-6 rounded-xl bg-background border-2"
					>
						<User class="size-6 mr-3 text-primary" />
						My Personal Dashboard
					</Button>
				</div>
			</section>
		</section>
	{/if}
</main>
