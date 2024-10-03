
targetDir="/home/admin/html/rapp_configuration"
pemFile="../../aws/CanadaAWSKeyPairForCranium.pem"


echo cp build/conf/app.conf.canada build/conf/app.conf
cp build/conf/app.conf.canada build/conf/app.conf


echo $targetDir
echo $pemFile

sftp -i $pemFile admin@3.99.64.220 << END
lpwd

cd $targetDir
pwd

put -R build/* .

END

echo "End of deployment"
