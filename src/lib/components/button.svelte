<script lang="ts" module>
	import type { Pathname } from "$app/types";
	import { cn, type WithElementRef } from "$lib/cn-utils";
	import clsx from "clsx";
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";
	import { tv, type VariantProps } from "tailwind-variants";

	export const buttonVariants = tv({
		base: clsx(
			"inline-flex shrink-0 items-center justify-center gap-2 rounded-none text-sm font-medium whitespace-nowrap outline-none",
			"focus-visible:border-black focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
			"border-2 border-black text-black"
		),
		variants: {
			shadow: {
				default:
					"shadow-sshadow active:translate-x-shadowx active:translate-y-shadowy active:shadow-none",
				none: "shadow-none"
			},
			variant: {
				default: "bg-blue-400 hover:bg-blue-400/90",
				destructive: "bg-red-400 hover:bg-red-400/90",
				outline: "bg-background hover:bg-foreground/10",
				ghost: "shadow-none border-none bg-inherit hover:bg-foreground/10"
				// secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs",
				// link: "text-primary underline-offset-4 hover:underline"
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3",
				sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
				lg: "h-10 px-6 has-[>svg]:px-4",
				icon: "size-9",
				"icon-sm": "size-8",
				"icon-lg": "size-10"
			}
		},
		defaultVariants: {
			shadow: "default",
			variant: "default",
			size: "default"
		}
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];
	export type ButtonShadow = VariantProps<typeof buttonVariants>["shadow"];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
			shadow?: ButtonShadow;
			href?: Pathname | (string & Record<never, never>);
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = "default",
		size = "default",
		shadow = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

<!-- todo: fix this some how -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size, shadow }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size, shadow }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
