#!/bin/sh

cd static/images/release-notes

for f in original/*.png; do
	cwebp -quiet -q 80 "$f" -o ./"${f%.png}.webp";
	echo "${f%.png}"
done;

mv original/*.webp .
