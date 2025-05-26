
TARGET_DIR=/Users/goh/work/fiserv/synapweb_sysconfig

ls -lt $TARGET_DIR
echo $TARGET_DIR

read -n 1 -p "Continue ? (y/n)" answer

echo 
if [ "$answer" != "y" ]
then
    echo "Abort ..."
    exit 2
fi

cp ./src/*.js $TARGET_DIR/src
cp ./public/conf/default.conf $TARGET_DIR/public/conf
cp ./public/conf/label*.conf $TARGET_DIR/public/conf


ls -lt $TARGET_DIR
