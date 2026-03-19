//go:build !windows

package main

import "syscall"

func windowsSysProcAttr() *syscall.SysProcAttr {
	return nil // unused on non-Windows
}
