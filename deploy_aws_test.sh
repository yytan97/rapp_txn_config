
targetDir="/home/admin/synap/rapp_configuration"
pemFile="../synap-ec2-key-pair.pem"


echo cp build/conf/app.conf.canada build/conf/app.conf
cp build/conf/app.conf.canada build/conf/app.conf


echo $targetDir
echo $pemFile

sftp -i $pemFile admin@ec2-18-209-166-25.compute-1.amazonaws.com << END
lpwd

cd $targetDir
pwd

put -R build/* .

END

echo "End of deployment"
