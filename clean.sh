find . -name ".DS_Store" -print | while read line
do
	echo "rm $line"
	rm $line
done
