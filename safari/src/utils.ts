import _ from "lodash"
import osascript from "osascript-tag"
import { URL } from "url"
import Fuse from "fuse.js"

import { getPreferenceValues, showToast, Toast } from "@raycast/api"

import { HistoryItem, Tab } from "./types"

type Preferences = {
	safariAppIdentifier: string
}

export const { safariAppIdentifier }: Preferences = getPreferenceValues()

export const executeJxa = async (script: string) => {
	try {
		return await osascript.jxa({ parse: true })`${script}`
	} catch (err: unknown) {
		if (typeof err === "string") {
			const message = err.replace("execution error: Error: ", "")
			if (message.match(/Application can't be found/)) {
				await showToast({
					style: Toast.Style.Failure,
					title: "Application not found",
					message: "Things must be running",
				})
			} else {
				await showToast({
					style: Toast.Style.Failure,
					title: "Something went wrong",
					message: message,
				})
			}
		}
	}
}

const parseUrl = (url: string) => {
	try {
		return new URL(url)
	} catch (err) {
		return null
	}
}

export const getTabUrl = (url: string) => {
	const parsedUrl = parseUrl(url)

	// Extract URL from suspended tabs (Tab Suspender for Safari)
	if (
		parsedUrl &&
		parsedUrl.protocol === "safari-extension:" &&
		parsedUrl.searchParams.has("url")
	) {
		return parsedUrl.searchParams.get("url") || url
	}

	return url
}

export const getUrlDomain = (url: string) => {
	const parsedUrl = parseUrl(url)
	if (parsedUrl && parsedUrl.hostname) {
		return parsedUrl.hostname.replace(/^www\./, "")
	}
}

export const formatDate = (date: string) =>
	new Date(date).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	})

export const getTitle = (tab: Tab) => _.truncate(tab.title, { length: 75 })

export const plural = (count: number, string: string) =>
	`${count} ${string}${count > 1 ? "s" : ""}`

export const search = function (
	collection: object[],
	keys: string[],
	searchText: string,
) {
	if (!searchText) {
		return collection
	}

	return new Fuse(collection, { keys }).search(searchText).map((x) => x.item)
}

const dtf = new Intl.DateTimeFormat(undefined, {
	weekday: "long",
	year: "numeric",
	month: "long",
	day: "numeric",
})

export const groupHistoryByDay = (
	groups: Map<string, HistoryItem[]>,
	entry: HistoryItem,
) => {
	const date = dtf.format(new Date(entry.lastVisited))
	if (!date) {
		return groups
	}

	const group = groups.get(date) ?? []
	group.push(entry)
	groups.set(date, group)
	return groups
}
