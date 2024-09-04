
msg="Update `date '+%Y%m%d %H%M%S'`"
if [ "$1" != "" ]
then
    msg="Update `date '+%Y%m%d %H%M%S'`; $1"
fi


git status

echo $msg 
read -n 1 -p "Continue update ? (y/n)" answer

echo 
if [ "$answer" != "y" ]
then
    echo "Abort ..."
    exit 2
fi

git add .
git commit -m "$msg"
git push origin main
