"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useIdeStore } from "@/store/ide/use-ide-store"
import { useState } from "react"

export function SettingsDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { role, setRole } = useIdeStore()

    // Local state for settings that aren't in global store yet
    const [theme, setTheme] = useState("dark")
    const [fontSize, setFontSize] = useState("14")
    const [wordWrap, setWordWrap] = useState(true)
    const [minimap, setMinimap] = useState(true)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>IDE Settings</DialogTitle>
                    <DialogDescription>
                        Customize your editing experience.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="role">User Role (Debug)</Label>
                            <div className="text-[0.8rem] text-muted-foreground">Override your current session role</div>
                        </div>
                        <Select value={role} onValueChange={(v: any) => setRole(v)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="instructor">Instructor</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="theme">Color Theme</Label>
                            <div className="text-[0.8rem] text-muted-foreground">Select IDE appearance</div>
                        </div>
                        <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="dark">Visual Studio Dark</SelectItem>
                                    <SelectItem value="light">Visual Studio Light</SelectItem>
                                    <SelectItem value="hc">High Contrast</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="fontsize">Font Size</Label>
                            <div className="text-[0.8rem] text-muted-foreground">Editor font size in pixels</div>
                        </div>
                        <Input
                            id="fontsize"
                            type="number"
                            className="w-[180px]"
                            value={fontSize}
                            onChange={(e) => setFontSize(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="word-wrap">Word Wrap</Label>
                        <Switch id="word-wrap" checked={wordWrap} onCheckedChange={setWordWrap} />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="minimap">Minimap</Label>
                        <Switch id="minimap" checked={minimap} onCheckedChange={setMinimap} />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={() => onOpenChange(false)}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
